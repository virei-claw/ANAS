from playwright.sync_api import sync_playwright
import json

PORT = 4173

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("1. Login...")
    page.goto(f'http://localhost:{PORT}/login')
    page.wait_for_load_state('networkidle')
    page.locator('input[type="text"]').fill('admin')
    page.locator('input[type="password"]').fill('admin123')
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    print("\n2. Go to audio detail page...")
    page.goto(f'http://localhost:{PORT}/audio/91048618-9189-4af6-aea2-1a30ed6f234c')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    print("\n3. Capture API response...")
    # Listen for API calls
    api_responses = []

    def on_response(response):
        if '/api/annotations' in response.url:
            try:
                data = response.json()
                api_responses.append(data)
            except:
                pass

    page.on('response', on_response)
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    for i, resp in enumerate(api_responses):
        print(f"\n   Response {i+1}:")
        if isinstance(resp, list) and len(resp) > 0:
            ann = resp[0]
            print(f"   Annotation keys: {list(ann.keys())}")
            print(f"   status value: {ann.get('status', 'NOT FOUND')}")
        elif isinstance(resp, dict):
            print(f"   Keys: {list(resp.keys())}")

    print("\n4. Check React state...")
    # Try to get component state via evaluate
    result = page.evaluate("""
        () => {
            // Look for any element with status text
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map(b => b.textContent);
        }
    """)
    print(f"   Buttons: {result}")

    browser.close()
