import asyncio
import websockets
import socket
import struct
from collections import defaultdict
from dotenv import load_dotenv
import os

load_dotenv()

UDP_IP = os.getenv("UDP_IP")
UDP_PORT = int(os.getenv("UDP_PORT"))
WS_PORT = int(os.getenv("WS_PORT"))

# UDPサーバーのセットアップ
audp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
audp_sock.bind((UDP_IP, UDP_PORT))
audp_sock.setblocking(False)

connected = set()
image_buffers = defaultdict(dict)  # 送信者ごとの画像バッファ

async def udp_receiver():
    while True:
        try:
            data, addr = audp_sock.recvfrom(65536)
            if data and len(data) >= 12:  # ヘッダーサイズ（12バイト）
                # ヘッダー情報を解析
                chunk_num, total_chunks, chunk_size = struct.unpack('!III', data[:12])
                chunk_data = data[12:12+chunk_size]
                
                # 画像バッファに保存
                image_buffers[addr][chunk_num] = chunk_data
                
                # 全チャンクが揃ったら画像を再構築
                if len(image_buffers[addr]) == total_chunks:
                    # チャンクを順番に結合
                    image_data = b''
                    for i in range(total_chunks):
                        if i in image_buffers[addr]:
                            image_data += image_buffers[addr][i]
                    
                    # 全WebSocketクライアントに送信
                    for ws in connected:
                        try:
                            await ws.send(image_data)
                        except Exception:
                            pass
                    
                    # バッファをクリア
                    del image_buffers[addr]
                    print(f"画像再構築完了: {len(image_data)} bytes")
                
        except BlockingIOError:
            await asyncio.sleep(0.01)

async def ws_handler(websocket):
    connected.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)

async def main():
    ws_server = await websockets.serve(ws_handler, UDP_IP, WS_PORT)
    print(f"UDP受信サーバー起動: {UDP_IP}:{UDP_PORT}")
    print(f"WebSocketサーバー起動: {UDP_IP}:{WS_PORT}")
    await udp_receiver()

if __name__ == "__main__":
    asyncio.run(main()) 