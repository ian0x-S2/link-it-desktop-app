use std::time::Duration;

use scraper::{Html, Selector};

#[derive(serde::Serialize)]
struct Metadata {
    title: Option<String>,
    description: Option<String>,
    image_url: Option<String>,
    favicon_url: Option<String>,
}

// ---------------------------------------------------------------------------
// Selector helpers
// ---------------------------------------------------------------------------

/// Returns the `content` attribute of the first `<meta>` tag matching the given
/// CSS selector string, or `None` if not found.
fn meta_content(document: &Html, selector_str: &str) -> Option<String> {
    let selector = Selector::parse(selector_str).ok()?;
    document
        .select(&selector)
        .next()
        .and_then(|el| el.value().attr("content"))
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// Returns the first non-empty value from a list of CSS selectors, each
/// expected to have a `content` attribute.
fn meta_content_cascade(document: &Html, selectors: &[&str]) -> Option<String> {
    for &sel in selectors {
        if let Some(val) = meta_content(document, sel) {
            return Some(val);
        }
    }
    None
}

// ---------------------------------------------------------------------------
// Field extractors
// ---------------------------------------------------------------------------

fn extract_title(document: &Html) -> Option<String> {
    // 1. og:title
    // 2. twitter:title
    // 3. <title> tag
    if let Some(val) = meta_content_cascade(
        document,
        &[
            "meta[property='og:title']",
            "meta[name='og:title']",
            "meta[name='twitter:title']",
            "meta[property='twitter:title']",
        ],
    ) {
        return Some(val);
    }

    let selector = Selector::parse("title").ok()?;
    document
        .select(&selector)
        .next()
        .map(|el| el.text().collect::<String>().trim().to_string())
        .filter(|s| !s.is_empty())
}

fn extract_description(document: &Html) -> Option<String> {
    meta_content_cascade(
        document,
        &[
            "meta[property='og:description']",
            "meta[name='og:description']",
            "meta[name='twitter:description']",
            "meta[property='twitter:description']",
            "meta[name='description']",
        ],
    )
}

fn extract_image(document: &Html) -> Option<String> {
    meta_content_cascade(
        document,
        &[
            "meta[property='og:image']",
            "meta[name='og:image']",
            "meta[property='og:image:url']",
            "meta[name='twitter:image:src']",
            "meta[name='twitter:image']",
            "meta[property='twitter:image']",
        ],
    )
}

/// Extracts the best favicon `href` from `<link>` tags.
/// Priority: apple-touch-icon → shortcut icon → icon
fn extract_favicon_href(document: &Html) -> Option<String> {
    // Ordered from most-preferred to least-preferred
    let candidates = [
        "link[rel~='apple-touch-icon']",
        "link[rel~='apple-touch-icon-precomposed']",
        "link[rel='shortcut icon']",
        "link[rel~='icon']",
    ];

    for sel_str in &candidates {
        if let Ok(selector) = Selector::parse(sel_str) {
            if let Some(el) = document.select(&selector).next() {
                if let Some(href) = el.value().attr("href") {
                    let href = href.trim();
                    if !href.is_empty() {
                        return Some(href.to_string());
                    }
                }
            }
        }
    }
    None
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

fn resolve_url(href: &str, base_url: &str) -> String {
    if href.starts_with("http://") || href.starts_with("https://") {
        return href.to_string();
    }

    let Some(scheme_end) = base_url.find("://") else {
        return href.to_string();
    };

    let scheme = &base_url[..scheme_end];
    let after_scheme = &base_url[scheme_end + 3..];
    let host = after_scheme.split('/').next().unwrap_or(after_scheme);

    if href.starts_with("//") {
        return format!("{}://{}", scheme, &href[2..]);
    }

    if href.starts_with('/') {
        return format!("{}://{}{}", scheme, host, href);
    }

    // Relative path — resolve against base directory
    let base_dir = if base_url.ends_with('/') {
        base_url.to_string()
    } else {
        let mut parts: Vec<&str> = base_url.split('/').collect();
        if parts.len() > 3 {
            parts.pop();
            parts.join("/") + "/"
        } else {
            base_url.to_string() + "/"
        }
    };

    format!("{}{}", base_dir, href)
}

fn google_favicon_fallback(base_url: &str) -> String {
    let host = base_url
        .find("://")
        .map(|i| &base_url[i + 3..])
        .unwrap_or(base_url)
        .split('/')
        .next()
        .unwrap_or(base_url);

    format!("https://www.google.com/s2/favicons?domain={}&sz=32", host)
}

// ---------------------------------------------------------------------------
// Tauri command
// ---------------------------------------------------------------------------

#[tauri::command]
async fn fetch_metadata(url: String) -> Result<Metadata, String> {
    let mut normalized_url = url.trim().to_string();
    if !normalized_url.to_lowercase().starts_with("http://")
        && !normalized_url.to_lowercase().starts_with("https://")
    {
        normalized_url = format!("https://{}", normalized_url);
    }

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&normalized_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let final_url = response.url().as_str().to_string();

    let html = response.text().await.map_err(|e| e.to_string())?;

    let document = Html::parse_document(&html);

    let title = extract_title(&document);
    let description = extract_description(&document);

    let image_url = extract_image(&document)
        .map(|img| resolve_url(&img, &final_url));

    let favicon_url = extract_favicon_href(&document)
        .map(|href| resolve_url(&href, &final_url))
        .unwrap_or_else(|| google_favicon_fallback(&final_url));

    Ok(Metadata {
        title,
        description,
        image_url,
        favicon_url: Some(favicon_url),
    })
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, fetch_metadata])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
