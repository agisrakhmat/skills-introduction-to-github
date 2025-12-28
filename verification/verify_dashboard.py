
import os
import sys
from playwright.sync_api import sync_playwright

# Mock the Google Apps Script environment
# In a real scenario, this would interact with the deployed script.
# Here we will simulate the Dashboard HTML loading with mocked data injection.
# Since we can't easily run `google.script.run` in a static HTML file locally,
# we will modify the HTML slightly on the fly or inject a script to mock it.

def verify_dashboard():
    # Read the Dashboard HTML
    with open('src/frontend/Dashboard_Student.html', 'r') as f:
        html_content = f.read()

    # Inject Mock Data and override `google.script.run`
    # This simulates the callback `withSuccessHandler(renderDashboard).getStudentDashboardData(...)`
    mock_script = """
    <script>
      // Mock google.script.run
      const mockData = {
        profile: {
          name: 'Ahmad Siswa',
          student_id: 'ST001',
          current_mustawa: 2,
          status: 'ACTIVE'
        },
        academic_history: [
          { level: 1, status: 'PASSED', passed_count: 2, total_count: 2 },
          { level: 2, status: 'ACTIVE', passed_count: 0, total_count: 2 },
          { level: 3, status: 'LOCKED', passed_count: 0, total_count: 0 }
        ],
        active_courses: [
          { course_id: 'MK201', name: 'Aqidah Lanjutan', semester_period: '2024-GENAP', sks: 2 }
        ],
        available_courses: [
          { course_id: 'MK202', name: 'Fiqih Muamalah', sks: 2 }
        ]
      };

      // Override the real function for testing
      google = {
        script: {
          run: {
            withSuccessHandler: function(callback) {
              return {
                withFailureHandler: function(failCallback) {
                  return {
                     getStudentDashboardData: function(email) {
                        console.log('Fetching mock data for ' + email);
                        setTimeout(() => callback(mockData), 500);
                     }
                  }
                }
              }
            }
          }
        }
      };

      // Mock local storage to simulate logged in state
      localStorage.setItem('user_email', 'student@example.com');

      // Mock getScriptUrl
      function getScriptUrl() { return '#'; }
    </script>
    """

    # Insert mock script before </head>
    html_with_mock = html_content.replace('</head>', mock_script + '</head>')

    # Write to temp file
    with open('verification/temp_dashboard.html', 'w') as f:
        f.write(html_with_mock)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Load the mocked HTML
        page.goto('file://' + os.path.abspath('verification/temp_dashboard.html'))

        # Wait for the dashboard to render (loading spinner to disappear)
        page.wait_for_selector('#main-content:not(.hidden)')

        # Verify specific elements
        # 1. Profile Name
        name = page.inner_text('#profile-name')
        print(f"Profile Name: {name}")
        if name != 'Ahmad Siswa':
             print("FAIL: Profile name incorrect")
             sys.exit(1)

        # 2. Current Mustawa
        level = page.inner_text('#profile-level')
        print(f"Level: {level}")
        if 'Mustawa 2' not in level:
            print("FAIL: Level incorrect")
            sys.exit(1)

        # 3. Active Course (Aqidah Lanjutan)
        if 'Aqidah Lanjutan' in page.content():
            print("PASS: Active Course Visible")
        else:
            print("FAIL: Active Course Missing")
            sys.exit(1)

        # 4. Available Course (Fiqih Muamalah)
        if 'Fiqih Muamalah' in page.content():
             print("PASS: Available Course Visible")
        else:
             print("FAIL: Available Course Missing")
             sys.exit(1)

        # Screenshot
        page.screenshot(path='verification/dashboard_student.png')
        print("Screenshot saved to verification/dashboard_student.png")

        browser.close()

if __name__ == "__main__":
    verify_dashboard()
