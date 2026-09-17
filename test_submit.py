from playwright.sync_api import sync_playwright

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    def on_console(msg):
        if msg.type == 'error':
            errors.append(str(msg.text))

    page.on('console', on_console)
    page.on('pageerror', lambda err: errors.append(str(err)))

    print("1. Login...")
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.locator('input[type="text"]').fill('admin')
    page.locator('input[type="password"]').fill('admin123')
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    print("   OK")

    print("\n2. Go to audio detail...")
    page.goto('http://localhost:3000/audio/91048618-9189-4af6-aea2-1a30ed6f234c')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print("   OK")

    print("\n3. Check for annotations list...")
    ann_rows = page.locator('table tbody tr')
    count = ann_rows.count()
    print(f"   Found {count} annotations")

    if count > 0:
        print("\n4. Look for '提交审核' button...")
        submit_btn = page.locator('button:has-text("提交审核")')
        if submit_btn.count() > 0:
            print("   Found '提交审核' button!")
            submit_btn.first.click()
            page.wait_for_timeout(1000)
            # Check if confirmation dialog appeared or success message
            print("   Clicked submit button")
        else:
            print("   No '提交审核' button found")

    print("\n5. Screenshot...")
    page.screenshot(path='test_submit.png', full_page=True)

    print("\n" + "="*50)
    app_errors = [e for e in errors if 'reportAllChanges' not in e]
    if app_errors:
        print(f"Application errors: {len(app_errors)}")
        for e in app_errors[:3]:
            print(f"  - {e[:100]}")
    else:
        print("No application errors")

    browser.close()
