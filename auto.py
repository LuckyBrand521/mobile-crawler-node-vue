import subprocess, time, datetime
import psutil
from subprocess import Popen
index = 1
while True:
    start_time = time.time()
    print("Running Index: ", index)
    print('Running all scrapers.....', datetime.datetime.fromtimestamp(start_time).strftime("%Y-%m-%d %H:%M:%S"))
    subprocess.call([r'C:\Users\Genius\Desktop\Mobile_backup\Mobile_backup\starter.bat'], shell=False)
    time.sleep(12*3600)
    for process in psutil.process_iter():
        if 'cmd.exe' in process.name():
            process_time = process.create_time()
            time_diff = process_time - start_time
            if time_diff < 3:
                process.kill()
        if 'chrome.exe' in process.name():
            process.kill()
    time.sleep(5)
    index = index + 1
