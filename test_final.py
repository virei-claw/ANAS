from playwright.sync_api import sync_playwright

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    def on_console(msg):
        if msg.type == 'error':
            errors.append(str(msg.text))

    page.on('console', on_console)

    def on_error(err):
        errors.append(str(err))

    page.on('pageerror', on_error)

    print("1. Login...")
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    page.locator('input[type="text"]').fill('admin')
    page.locator('input[type="password"]').fill('admin123')
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    print("   OK")

    print("\n2. Test filter buttons...")
    buttons = page.locator('button').all()
    results = []
    for i in range(1, 5):
        txt = buttons[i].text_content() if i < len(buttons) else ''
        buttons[i].click()
        page.wait_for_timeout(1500)
        rows = page.locator('tbody tr').count()
        results.append(f"   {txt}: {rows} rows")
    for r in results:
        print(r)

    print("\n3. Navigate to audio detail...")
    page.locator('button:has-text("全部")').click()
    page.wait_for_timeout(1000)
    page.locator('tbody tr:first-child a').first.click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print(f"   URL: {page.url}")

    print("\n4. Check for errors...")
    app_errors = [e for e in errors if 'reportAllChanges' not in e]
    if app_errors:
        print(f"   Application errors: {len(app_errors)}")
        for e in app_errors[:3]:
            print(f"   - {e[:100]}")
    else:
        print("   No application errors")

    print("\n5. Screenshot...")
    page.screenshot(path='test_final.png', full_page=True)
    print("   Saved to test_final.png")

    print("\n" + "="*50)
    if app_errors:
        print("FAILED - Application errors found")
    else:
        print("PASSED - No application errors")

    browser.close()
