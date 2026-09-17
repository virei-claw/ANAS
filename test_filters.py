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
    page.wait_for_timeout(1000)
    print("   Logged in")

    print("\n2. Initial state...")
    rows = page.locator('tbody tr')
    print(f"   Rows (全部): {rows.count()}")

    # Get all filter buttons - they appear to be in order
    # Index: 1=全部, 2=已标注, 3=未标记, 4=审核中
    buttons = page.locator('button').all()
    print(f"   Total buttons: {len(buttons)}")

    print("\n3. Click each filter button by index...")
    for i in range(1, 5):
        if i < len(buttons):
            txt = buttons[i].text_content()
            buttons[i].click()
            page.wait_for_timeout(1000)
            rows = page.locator('tbody tr')
            print(f"   Button {i} ('{txt}'): {rows.count()} rows")

    browser.close()
