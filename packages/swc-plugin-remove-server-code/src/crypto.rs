use base64::{engine::general_purpose::STANDARD, Engine};

fn cyrb53(s: &str, seed: u32) -> (u32, u32) {
    let mut h1: u32 = 0xdeadbeef ^ seed;
    let mut h2: u32 = 0x41c6ce57 ^ seed;

    for &ch in s.as_bytes() {
        h1 = (h1 ^ (ch as u32)).wrapping_mul(0x85ebca6b);
        h2 = (h2 ^ (ch as u32)).wrapping_mul(0xc2b2ae35);
        h1 = h1.rotate_right(19);
        h2 = h2.rotate_right(17);
    }

    h1 = (h1 ^ (h1 >> 16)).wrapping_mul(0x85ebca6b) ^ (h2 ^ (h2 >> 13)).wrapping_mul(0xc2b2ae35);
    h2 = (h2 ^ (h2 >> 16)).wrapping_mul(0x85ebca6b) ^ (h1 ^ (h1 >> 13)).wrapping_mul(0xc2b2ae35);

    (h1, h2)
}

fn to_base64(bytes: &[u8]) -> String {
    STANDARD.encode(bytes)
}

pub fn hash_ref(message: &str) -> String {
    let (x, y) = cyrb53(message, 0);
    let mut buffer = [0u8; 8];
    buffer[..4].copy_from_slice(&x.to_be_bytes());
    buffer[4..].copy_from_slice(&y.to_be_bytes());
    to_base64(&buffer)[..7].to_string()
}
