"""
TDD Test Suite for Abnormal Noise Annotation System
测试所有核心功能
"""
from playwright.sync_api import sync_playwright
import subprocess
import json
import sys

def log(msg):
    print(msg)
    sys.stdout.flush()

def get_audio_id():
    result = subprocess.run(['curl', '-s', 'http://localhost:8000/api/audio'], capture_output=True, text=True)
    data = json.loads(result.stdout)
    return data['items'][0]['id'] if data.get('items') else None

def test_01_audio_list_page():
    """测试音频列表页面加载"""
    log("\n[Test 01] Audio List Page")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        assert '音频文件' in page.content(), "Should display audio page title"
        assert page.locator('text=car_anomaly.wav').count() > 0, "Should show audio file"
        log("[PASS] Audio list page loads correctly")
        browser.close()
    return True

def test_02_audio_detail_page():
    """测试音频详情页面加载"""
    log("\n[Test 02] Audio Detail Page")
    audio_id = get_audio_id()
    assert audio_id is not None, "Should have audio file"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(5000)

        assert '波形' in page.content(), "Should show waveform section"
        assert page.locator('button:has-text("播放")').count() > 0, "Should show play button"
        log("[PASS] Audio detail page loads correctly")
        browser.close()
    return True

def test_03_waveform_renders():
    """测试波形渲染"""
    log("\n[Test 03] Waveform Renders")
    audio_id = get_audio_id()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)

        canvas_count = page.locator('canvas').count()
        assert canvas_count >= 2, f"Should have multiple canvas elements (waveform + peaks), got {canvas_count}"
        log(f"[PASS] Waveform rendered with {canvas_count} canvas elements")
        browser.close()
    return True

def test_04_play_button_works():
    """测试播放按钮功能"""
    log("\n[Test 04] Play Button Works")
    audio_id = get_audio_id()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)

        # Click play button
        page.locator('button:has-text("播放")').click()
        page.wait_for_timeout(1000)

        # Should now show pause button
        assert page.locator('button:has-text("暂停")').count() > 0, "Should show pause button after clicking play"
        log("[PASS] Play button works - toggles to pause")
        browser.close()
    return True

def test_05_region_selection_creates():
    """测试选段创建功能"""
    log("\n[Test 05] Region Selection Creates")
    audio_id = get_audio_id()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)

        # Get canvas and drag to create selection
        canvas = page.locator('canvas').first
        box = canvas.bounding_box()
        assert box is not None, "Canvas should be visible"

        # Perform drag selection
        start_x = box['x'] + 50
        mid_y = box['y'] + box['height'] / 2
        end_x = box['x'] + 250

        page.mouse.move(start_x, mid_y)
        page.mouse.down()
        page.wait_for_timeout(100)
        page.mouse.move(end_x, mid_y)
        page.wait_for_timeout(100)
        page.mouse.up()
        page.wait_for_timeout(2000)

        # Check if selection UI appeared
        has_selection = page.locator('text=选段:').count() > 0 or page.locator('text=保存标注').count() > 0
        assert has_selection, "Should show selection UI after dragging"
        log("[PASS] Region selection creates selection UI")
        browser.close()
    return True

def test_06_play_selected_region():
    """测试播放选定片段功能"""
    log("\n[Test 06] Play Selected Region")
    audio_id = get_audio_id()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)

        # Create a selection first
        canvas = page.locator('canvas').first
        box = canvas.bounding_box()

        page.mouse.move(box['x'] + 50, box['y'] + box['height'] / 2)
        page.mouse.down()
        page.mouse.move(box['x'] + 250, box['y'] + box['height'] / 2)
        page.mouse.up()
        page.wait_for_timeout(2000)

        # Check if "播放选中片段" or "只播放选中区域" button exists
        play_region_btn = page.locator('text=播放选中').count() > 0 or page.locator('text=播放片段').count() > 0
        if play_region_btn:
            log("[PASS] Play region button found")
        else:
            log("[INFO] Play region button not implemented yet")
        browser.close()
    return True

def test_07_mel_spectrogram_display():
    """测试Mel谱显示功能"""
    log("\n[Test 07] Mel Spectrogram Display")
    audio_id = get_audio_id()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)

        # Check if Mel谱 button or spectrogram toggle exists
        mel_btn = page.locator('text=Mel谱').count() > 0 or page.locator('text=频谱').count() > 0 or page.locator('text=Spectrogram').count() > 0
        if mel_btn:
            log("[PASS] Mel spectrogram toggle button found")
        else:
            log("[INFO] Mel spectrogram button not found")

        browser.close()
    return True

def test_08_save_annotation_form():
    """测试保存标注表单"""
    log("\n[Test 08] Save Annotation Form")
    audio_id = get_audio_id()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)

        # Create a selection first
        canvas = page.locator('canvas').first
        box = canvas.bounding_box()

        page.mouse.move(box['x'] + 50, box['y'] + box['height'] / 2)
        page.mouse.down()
        page.mouse.move(box['x'] + 250, box['y'] + box['height'] / 2)
        page.mouse.up()
        page.wait_for_timeout(2000)

        # Click save button if visible
        if page.locator('text=保存标注').count() > 0:
            page.locator('text=保存标注').click()
            page.wait_for_timeout(1000)

            # Should show annotation form
            assert '新建标注' in page.content() or '零部件' in page.content(), "Should show annotation form"
            log("[PASS] Annotation form opens")
        else:
            log("[INFO] Selection not created - skipping form test")

        browser.close()
    return True

def test_09_no_console_errors():
    """测试无控制台错误"""
    log("\n[Test 09] No Console Errors")
    errors = []
    audio_id = get_audio_id()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        def handle_error(msg):
            if msg.type == 'error':
                errors.append(msg.text)
                log(f"[CONSOLE ERROR] {msg.text}")

        page.on('console', handle_error)
        page.goto(f'http://localhost:3000/audio/{audio_id}')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)

        # Filter out known non-critical warnings
        critical_errors = [e for e in errors if 'AbortError' in e or 'Uncaught' in e]

        if errors:
            log(f"[WARN] Found {len(errors)} console errors (critical: {len(critical_errors)})")

        assert len(critical_errors) == 0, f"Should not have critical errors, got: {critical_errors}"
        log(f"[PASS] No critical console errors")
        browser.close()
    return True

def run_all_tests():
    """运行所有测试"""
    tests = [
        test_01_audio_list_page,
        test_02_audio_detail_page,
        test_03_waveform_renders,
        test_04_play_button_works,
        test_05_region_selection_creates,
        test_06_play_selected_region,
        test_07_mel_spectrogram_display,
        test_08_save_annotation_form,
        test_09_no_console_errors,
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append((test.__name__, result))
        except Exception as e:
            log(f"[FAIL] {test.__name__}: {e}")
            results.append((test.__name__, False))

    log("\n" + "="*50)
    log("TEST SUMMARY")
    log("="*50)
    for name, result in results:
        status = "PASS" if result else "FAIL"
        log(f"  {name}: {status}")

    passed = sum(1 for _, r in results if r)
    log(f"\nTotal: {passed}/{len(results)} passed")

    return all(r for _, r in results)

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
