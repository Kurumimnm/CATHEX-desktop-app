from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import socket
from dotenv import load_dotenv
import os

load_dotenv()

RASPI_IP = os.getenv("RASPI_IP")

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def send_to_raspi(direction):
    HOST = RASPI_IP  # Raspberry PiのIPアドレス（後で設定）
    PORT = 9000        # Raspberry Pi側のソケットサーバーポート
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((HOST, PORT))
            logger.info(f'Raspberry Piへ接続完了: {HOST}:{PORT}')
            s.sendall(direction.encode('utf-8'))
            logger.info('Raspberry Piへデータ送信完了')
        logger.info('Raspberry Piとの接続を切断しました')
    except Exception as e:
        logger.error(f'Raspberry Piへの送信エラー: {str(e)}')
        raise

@app.route('/control', methods=['POST'])
def control():
    try:
        data = request.get_json()
        direction = data.get('direction')
        
        if not direction:
            return jsonify({'error': 'Direction is required'}), 400
            
        logger.info(f'Received control command: {direction}')
        
        # Raspberry Piへの制御コマンドを送信
        send_to_raspi(direction)
        
        return jsonify({'status': 'success', 'direction': direction})
        
    except Exception as e:
        logger.error(f'Error processing control command: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
