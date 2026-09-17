from playwright.sync_api import sync_playwright

errors = []
failed = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    def log_console(msg):
        if msg.type == "error":
            errors.append(f"[{msg.type}] {msg.text}")

    page.on("console", log_console)
    page.on("response", lambda r: failed.append(f"{r.status} {r.url}") if r.status >= 400 else None)

    # Login
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.fill('input[placeholder="请输入用户名"]', 'admin')
    page.fill('input[placeholder="请输入密码"]', 'admin123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(2000)

    # Go to review page
    page.goto('http://localhost:3000/review')
    page.wait_for_timeout(3000)

    browser.close()

print("=== Console Errors ===")
for e in errors:
    print(e)

print("\n=== Failed Requests ===")
for f in failed:
    print(f)
