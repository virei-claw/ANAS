from playwright.sync_api import sync_playwright

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    def on_console(msg):
        if msg.type == 'error':
            errors.append(f"CONSOLE ERROR: {msg.text}")

    page.on('console', on_console)

    def on_error(err):
        errors.append(f"PAGE ERROR: {err}")

    page.on('pageerror', on_error)

    print("1. Login...")
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.locator('input[type="text"]').fill('admin')
    page.locator('input[type="password"]').fill('admin123')
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    print("\n2. Initial state - check errors...")
    if errors:
        print(f"   Errors so far: {len(errors)}")
        for e in errors:
            print(f"   - {e}")
    else:
        print("   No errors")

    print("\n3. Click filter buttons and capture errors...")
    buttons = page.locator('button').all()

    for i in range(1, 5):
        if i < len(buttons):
            txt = buttons[i].text_content()
            print(f"\n   Clicking button {i} ('{txt}')...")
            buttons[i].click()
            page.wait_for_timeout(2000)
            if errors:
                print(f"   Errors after click: {len(errors)}")
                for e in errors[-5:]:  # Show last 5 errors
                    print(f"   - {e}")
            else:
                print("   No errors")

    print("\n" + "="*50)
    print(f"Total errors: {len(errors)}")
    for e in errors:
        print(f"  {e}")

    browser.close()
