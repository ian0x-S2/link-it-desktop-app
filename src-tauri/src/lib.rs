use std::time::Duration;

#[derive(serde::Serialize)]
struct Metadata {
    title: Option<String>,
    description: Option<String>,
    image_url: Option<String>,
    favicon_url: Option<String>,
}

fn decode_html_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
}

fn extract_title(html: &str) -> Option<String> {
    let lower = html.to_lowercase();
    if let Some(start_idx) = lower.find("<title>") {
        let content_start = start_idx + 7;
        if let Some(end_idx) = lower[content_start..].find("</title>") {
            let title = html[content_start..content_start + end_idx].trim();
            return Some(decode_html_entities(title));
        }
    }
    None
}

fn extract_meta_tag(html: &str, attr_name: &str, attr_val: &str) -> Option<String> {
    let lower_html = html.to_lowercase();
    let search_val = attr_val.to_lowercase();
    
    let mut search_pos = 0;
    while let Some(idx) = lower_html[search_pos..].find(&search_val) {
        let abs_idx = search_pos + idx;
        if let Some(tag_start) = html[..abs_idx].rfind('<') {
            if let Some(tag_end) = html[abs_idx..].find('>') {
                let abs_tag_end = abs_idx + tag_end;
                let tag_content = &html[tag_start..=abs_tag_end];
                let tag_lower = tag_content.to_lowercase();
                
                if tag_lower.starts_with("<meta") {
                    if tag_lower.contains(attr_name) && tag_lower.contains("content=") {
                        if let Some(content_idx) = tag_lower.find("content=") {
                            let content_part = &tag_content[content_idx + 8..];
                            let mut chars = content_part.chars();
                            if let Some(quote_char) = chars.next() {
                                if quote_char == '"' || quote_char == '\'' {
                                    if let Some(close_quote_idx) = content_part[1..].find(quote_char) {
                                        let content = &content_part[1..=close_quote_idx];
                                        return Some(decode_html_entities(content.trim()));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        search_pos = abs_idx + search_val.len();
    }
    None
}

fn get_metadata_field(html: &str, keys: &[(&str, &str)]) -> Option<String> {
    for &(attr_name, attr_val) in keys {
        if let Some(content) = extract_meta_tag(html, attr_name, attr_val) {
            return Some(content);
        }
    }
    None
}

fn resolve_url(href: &str, base_url: &str) -> String {
    if href.starts_with("http://") || href.starts_with("https://") {
        return href.to_string();
    }
    
    let parts: Vec<&str> = base_url.split("://").collect();
    if parts.len() < 2 {
        return href.to_string();
    }
    let protocol = parts[0];
    let rest = parts[1];
    let host = rest.split('/').next().unwrap_or(rest);
    
    if href.starts_with("//") {
        return format!("{}://{}", protocol, &href[2..]);
    }
    
    if href.starts_with('/') {
        return format!("{}://{}{}", protocol, host, href);
    }
    
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

fn extract_favicon(html: &str, base_url: &str) -> Option<String> {
    let lower_html = html.to_lowercase();
    let mut search_pos = 0;
    
    while let Some(rel_idx) = lower_html[search_pos..].find("rel=") {
        let abs_rel_idx = search_pos + rel_idx;
        if let Some(tag_start) = html[..abs_rel_idx].rfind('<') {
            if let Some(tag_end) = html[abs_rel_idx..].find('>') {
                let abs_tag_end = abs_rel_idx + tag_end;
                let tag_content = &html[tag_start..=abs_tag_end];
                let tag_lower = tag_content.to_lowercase();
                
                if tag_lower.starts_with("<link") && (tag_lower.contains("icon") || tag_lower.contains("shortcut icon") || tag_lower.contains("apple-touch-icon")) {
                    if let Some(href_idx) = tag_lower.find("href=") {
                        let href_part = &tag_content[href_idx + 5..];
                        let mut chars = href_part.chars();
                        if let Some(quote_char) = chars.next() {
                            if quote_char == '"' || quote_char == '\'' {
                                if let Some(close_quote_idx) = href_part[1..].find(quote_char) {
                                    let href_val = &href_part[1..=close_quote_idx];
                                    return Some(resolve_url(href_val.trim(), base_url));
                                }
                            }
                        }
                    }
                }
            }
        }
        search_pos = abs_rel_idx + 4;
    }
    None
}

fn get_google_favicon(base_url: &str) -> String {
    let parts: Vec<&str> = base_url.split("://").collect();
    if parts.len() >= 2 {
        let rest = parts[1];
        let host = rest.split('/').next().unwrap_or(rest);
        return format!("https://www.google.com/s2/favicons?domain={}&sz=32", host);
    }
    format!("https://www.google.com/s2/favicons?domain={}&sz=32", base_url)
}

#[tauri::command]
async fn fetch_metadata(url: String) -> Result<Metadata, String> {
    let mut normalized_url = url.trim().to_string();
    if !normalized_url.to_lowercase().starts_with("http://") && !normalized_url.to_lowercase().starts_with("https://") {
        normalized_url = format!("https://{}", normalized_url);
    }
    
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;
        
    let response = client.get(&normalized_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let final_url = response.url().as_str().to_string();
    
    let html = response.text()
        .await
        .map_err(|e| e.to_string())?;
        
    let title = extract_title(&html);
    
    let description = get_metadata_field(&html, &[
        ("property", "og:description"),
        ("name", "description"),
        ("property", "twitter:description"),
    ]);
    
    let image_url = get_metadata_field(&html, &[
        ("property", "og:image"),
        ("name", "image"),
        ("property", "twitter:image"),
    ]).map(|img| resolve_url(&img, &final_url));
    
    let favicon_url = extract_favicon(&html, &final_url)
        .unwrap_or_else(|| get_google_favicon(&final_url));
        
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
