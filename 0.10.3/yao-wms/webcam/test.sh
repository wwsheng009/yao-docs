webrtc-streamer rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4

# {
#   "urls": {
#     "cam01": { "video": "rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4" }
#   }
# }

webrtc-streamer -C config.json
webrtc-streamer -T  -C config.json
webrtc-streamer -o -C config.json
webrtc-streamer -o -T -C config.json

webrtc-streamer -T0.0.0.0:3478 -s- -tturn:turn@139.199.30.36:3478 -o -C test.json


webrtc-streamer -s- -tturn:turn@139.199.30.36:3478 -o -C test.json

sudo /usr/bin/ssh -N -R *:3478:127.0.0.1:3478  zhongtie@139.199.30.36

sudo nc -l -u -p 3478 < /tmp/fifo | nc localhost 3478 > /tmp/fifo


sudo apt-get update
sudo apt-get -y install coturn


Installing a TURN Server on Ubuntu
https://help.hcltechsw.com/sametime/11.6/admin/turnserver_ubuntu.html

Setup the TCP to UDP forward on the server
https://superuser.com/questions/53103/udp-traffic-through-ssh-tunnel
