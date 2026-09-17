from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Set localStorage manually to simulate logged-in state
    page.goto('http://localhost:3000/')
    page.wait_for_load_state('networkidle')

    # Set user data directly
    page.evaluate("""
        () => {
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('user', JSON.stringify({
                username: 'admin',
                full_name: 'Administrator'
            }));
        }
    """)

    # Reload to trigger useEffect
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print("After reload:")
    print(f"   URL: {page.url}")
    storage = page.evaluate("""
        () => ({
            token: localStorage.getItem('token'),
            user: localStorage.getItem('user')
        })
    """)
    print(f"   Token: {storage['token'][:20]}...")
    print(f"   User: {storage['user']}")

    # Check nav bar
    nav = page.locator('nav')
    print(f"\n   Nav visible: {nav.is_visible()}")
    nav_text = nav.text_content()
    print(f"   Nav text: {nav_text}")

    # Check if user div exists
    user_div = page.locator('nav >> text=Administrator')
    print(f"   User 'Administrator' found: {user_div.count() > 0}")

    # Check for login button vs user area
    login_btn = page.locator('nav >> text=登录')
    print(f"   Login button found: {login_btn.count() > 0}")

    page.screenshot(path='test_nav.png', full_page=True)

    browser.close()
