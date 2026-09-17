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
    page.locator('input[type="text"]').fill('admin')
    page.locator('input[type="password"]').fill('admin123')
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    print("   Logged in, URL:", page.url)

    print("\n2. Click first audio...")
    page.locator('tbody tr:first-child a').first.click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print("   URL:", page.url)

    print("\n3. Check waveform component...")
    waveform = page.locator('[class*="bg-gray-100"]')
    if waveform.count() > 0:
        print("   Waveform container found")

    # Check for buttons
    buttons = page.locator('button').all()
    print("   Found", len(buttons), "buttons")
    for btn in buttons:
        txt = btn.text_content()
        if txt:
            print("   - Button:", txt.strip()[:30])

    print("\n4. Check for console errors so far...")
    if errors:
        print("   Errors:", errors)
    else:
        print("   No errors")

    print("\n5. Taking screenshot...")
    page.screenshot(path='test_screenshot2.png', full_page=True)
    print("   Saved to test_screenshot2.png")

    print("\n" + "=" * 50)
    if errors:
        print("Total errors:", len(errors))
        for e in errors:
            print(" -", e)
    else:
        print("No console errors - ALL TESTS PASSED")

    browser.close()
