
import os
import sys
from playwright.sync_api import sync_playwright

def verify_course_room():
    with open('src/frontend/Course_Room.html', 'r') as f:
        html_content = f.read()

    # Mock Data
    mock_script = """
    <script>
      const mockEmail = "student@example.com";

      const mockRoomData = {
        course_name: 'Aqidah Lanjutan',
        sessions: [
          { id: 1, title: 'Pertemuan 1', date: '2024-02-05', status: 'HADIR', points: 100, recording_url: '#' },
          { id: 2, title: 'Pertemuan 2', date: '2024-02-12', status: 'ABSENT', points: 0, recording_url: '#' }
        ]
      };

      const serverFunctions = {
         getCourseRoomData: function(cId, email) {
            console.log('Mock: getCourseRoomData called');
            console.log('Mock: Data Status S2: ' + mockRoomData.sessions[1].status);
            // Must check if callback exists (it should)
            if (this._successHandler) setTimeout(() => this._successHandler(mockRoomData), 100);
         },
         submitAttendanceRecording: function(cId, date, email) {
            console.log('Mock: Submitting attendance for ' + date);
            mockRoomData.sessions[1].status = 'REKAMAN';
            mockRoomData.sessions[1].points = 80;
            if (this._successHandler) setTimeout(() => this._successHandler({ success: true }), 100);
         }
      };

      google = {
        script: {
          run: {
            withSuccessHandler: function(callback) {
              const runner = Object.create(serverFunctions);
              runner._successHandler = callback;
              runner.withFailureHandler = function(failCallback) {
                 this._failureHandler = failCallback;
                 return this;
              };
              return runner;
            },
            withFailureHandler: function(failCallback) {
              const runner = Object.create(serverFunctions);
              runner._failureHandler = failCallback;
              runner.withSuccessHandler = function(callback) {
                 this._successHandler = callback;
                 return this;
              };
              return runner;
            },
            ...serverFunctions // Allow direct calling if no handlers
          }
        }
      };

      localStorage.setItem('user_email', mockEmail);
      function getScriptUrl() { return '#'; }
      window.open = function(url) { console.log('Mock: Opening ' + url); };
    </script>
    """

    html_with_mock = html_content.replace('const courseId = "<?= course_id ?>";', 'const courseId = "MK201";')
    html_with_mock = html_with_mock.replace('</head>', mock_script + '</head>')

    with open('verification/temp_courseroom.html', 'w') as f:
        f.write(html_with_mock)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        page.goto('file://' + os.path.abspath('verification/temp_courseroom.html'))
        page.wait_for_selector('#session-list')

        print("Clicking 'Tonton Rekaman'...")
        page.click('button:has-text("Tonton Rekaman")')

        try:
            page.wait_for_selector('text=REKAMAN (80)', timeout=5000)
            print("PASS: Status updated to REKAMAN (80)")
        except Exception as e:
            print("FAIL: Status did not update.")
            sys.exit(1)

        page.screenshot(path='verification/course_room.png')
        browser.close()

if __name__ == "__main__":
    verify_course_room()
