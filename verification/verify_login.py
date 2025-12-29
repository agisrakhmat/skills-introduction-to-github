from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Absolute path to the file
        cwd = os.getcwd()
        file_path = f"file://{cwd}/frontend/Login_Student.html"

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # Override window.alert to not block execution
        page.on("dialog", lambda dialog: dialog.accept())

        # Fill form
        page.fill("#identifier", "6281234567890")
        page.fill("#password", "7890")

        # Click login
        page.click("#btnSubmit")

        # Wait for success message
        # The script simulates a delay of 1000ms
        page.wait_for_selector(".lms-alert-success", timeout=5000)

        # Take screenshot
        page.screenshot(path="verification/login_success.png")
        print("Screenshot saved to verification/login_success.png")

        browser.close()

if __name__ == "__main__":
    run()
