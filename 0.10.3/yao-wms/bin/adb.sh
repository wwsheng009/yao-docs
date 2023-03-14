# 安装ADB
#  https://wiki.t-firefly.com/ROC-RK3308-CC/adb_introduction.html#ubuntu-xia-de-adb-an-zhuang

# 安装
sudo apt-get update
sudo apt-get install android-tools-adb


# 设备标识
mkdir -p ~/.android
echo "0x2207" > ~/.android/adb_usb.ini


# udev 规则添加
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="2207", MODE="0666"' > /etc/udev/rules.d/51-android.rules

# udev 规则激活
sudo udevadm control --reload-rules
sudo udevadm trigger


# 重启ADB
sudo adb kill-server
adb start-server


