# Read UDP messages from the ESP32 (TTGO T1)
# Connect your laptop to the "Flower Flute" WiFi network first.

import socket

LOCAL_UDP_IP = "192.168.1.2"
SHARED_UDP_PORT = 4210
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((LOCAL_UDP_IP, SHARED_UDP_PORT))

NAMES = ["Flute1", "Flute2", "Flute3", "Flute4", "ModeChange", "MouthPiece"]


def loop():
    while True:
        data, addr = sock.recvfrom(2048)
        packed = data[0]
        parts = []
        for i, name in enumerate(NAMES):
            touched = "YES" if (packed >> i) & 1 else "NO"
            parts.append(f"{name}: {touched}")
        print(", ".join(parts))


if __name__ == "__main__":
    loop()
