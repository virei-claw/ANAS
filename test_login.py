from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("1. Login...")
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.locator('input[type="text"]').fill('admin')
    page.locator('input[type="password"]').fill('admin123')
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print(f"   URL after login: {page.url}")

    print("\n2. Check localStorage...")
    storage = page.evaluate("""
        () => {
            return {
                token: localStorage.getItem('token') ? 'exists' : 'null',
                user: localStorage.getItem('user')
            }
        }
    """)
    print(f"   Token: {storage['token']}")
    print(f"   User: {storage['user']}")

    print("\n3. Check NavBar user area...")
    # Look for user-related elements
    nav_html = page.locator('nav').inner_html()
    if 'admin' in nav_html.lower():
        print("   Found 'admin' in nav")
    else:
        print("   No 'admin' found in nav")

    # Get all visible text in nav
    nav_text = page.locator('nav').text_content()
    print(f"   Nav text: {nav_text}")

    page.screenshot(path='test_login.png', full_page=True)
    print("\n   Screenshot saved")

    browser.close()
