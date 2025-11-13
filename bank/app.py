from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import secrets
import os
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
CORS(app)

# Database file
DB_FILE = 'deposit_codes.db'

def init_db():
    """Initialize the database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create deposit_codes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS deposit_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('get', 'send')),
            expiry_date TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('pending', 'success', 'failed', 'expired', 'cancelled')),
            created_at TEXT NOT NULL,
            user_id TEXT NOT NULL,
            recipient_id TEXT,
            used_by TEXT,
            used_at TEXT,
            creator_token TEXT
        )
    ''')
    
    # Add creator_token column if it doesn't exist (for existing databases)
    try:
        cursor.execute('ALTER TABLE deposit_codes ADD COLUMN creator_token TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def generate_code():
    """Generate a random 6-digit code"""
    return str(secrets.randbelow(900000) + 100000)

def code_to_dict(row):
    """Convert database row to dictionary"""
    # sqlite3.Row doesn't have .get() method, use try/except for optional fields
    used_by = None
    used_at = None
    try:
        used_by = row['used_by']
    except (KeyError, IndexError):
        pass
    try:
        used_at = row['used_at']
    except (KeyError, IndexError):
        pass
    
    return {
        'id': row['id'],
        'code': row['code'],
        'amount': row['amount'],
        'type': row['type'],
        'expiryDate': row['expiry_date'],
        'status': row['status'],
        'createdAt': row['created_at'],
        'userId': row['user_id'],
        'recipientId': row['recipient_id'],
        'usedBy': used_by,
        'usedAt': used_at,
    }

# Initialize database on startup
init_db()

@app.route('/api/deposit-codes', methods=['POST'])
def create_deposit_code():
    """Create a new deposit code"""
    try:
        data = request.json
        user_id = data.get('userId')
        amount = float(data.get('amount', 0))
        code_type = data.get('type', 'get')  # 'get' or 'send'
        expiry_days = int(data.get('expiryDays', 7))
        creator_token = data.get('creatorToken')  # Auth token for "send" type codes
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        if code_type not in ['get', 'send']:
            return jsonify({'error': 'Type must be "get" or "send"'}), 400
        
        # For "send" type codes, we need the creator's token to make transfers
        if code_type == 'send' and not creator_token:
            return jsonify({'error': 'Creator token is required for "send" type codes'}), 400
        
        # Generate unique code
        code = generate_code()
        conn = get_db()
        cursor = conn.cursor()
        
        # Ensure code is unique
        while True:
            existing = cursor.execute('SELECT id FROM deposit_codes WHERE code = ?', (code,)).fetchone()
            if not existing:
                break
            code = generate_code()
        
        # Calculate expiry date
        expiry_date = (datetime.now() + timedelta(days=expiry_days)).isoformat()
        created_at = datetime.now().isoformat()
        
        # Insert code (store token only for "send" type)
        cursor.execute('''
            INSERT INTO deposit_codes (code, amount, type, expiry_date, status, created_at, user_id, recipient_id, creator_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (code, amount, code_type, expiry_date, 'pending', created_at, user_id, user_id, creator_token if code_type == 'send' else None))
        
        conn.commit()
        code_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'id': str(code_id),
            'code': code,
            'amount': amount,
            'type': code_type,
            'expiryDate': expiry_date,
            'status': 'pending',
            'createdAt': created_at,
            'userId': user_id,
            'recipientId': user_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/deposit-codes', methods=['GET'])
def get_deposit_codes():
    """Get all deposit codes for a user"""
    try:
        user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get all codes for user
        cursor.execute('''
            SELECT * FROM deposit_codes 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        # Check and update expired codes
        now = datetime.now()
        codes = []
        for row in rows:
            code_dict = code_to_dict(row)
            expiry_date = datetime.fromisoformat(code_dict['expiryDate'])
            
            # Auto-update expired codes
            if expiry_date < now and code_dict['status'] == 'pending':
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute('UPDATE deposit_codes SET status = ? WHERE id = ?', ('expired', code_dict['id']))
                conn.commit()
                conn.close()
                code_dict['status'] = 'expired'
            
            codes.append(code_dict)
        
        return jsonify(codes), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/deposit-codes/<code>', methods=['GET'])
def get_code_by_code(code):
    """Get a deposit code by its code string"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM deposit_codes WHERE code = ?', (code,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'error': 'Code not found'}), 404
        
        code_dict = code_to_dict(row)
        
        # Check if expired
        now = datetime.now()
        expiry_date = datetime.fromisoformat(code_dict['expiryDate'])
        if expiry_date < now and code_dict['status'] == 'pending':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('UPDATE deposit_codes SET status = ? WHERE id = ?', ('expired', code_dict['id']))
            conn.commit()
            conn.close()
            code_dict['status'] = 'expired'
        
        return jsonify(code_dict), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/deposit-codes/<int:code_id>', methods=['PUT'])
def update_deposit_code(code_id):
    """Update a deposit code (e.g., cancel it)"""
    try:
        data = request.json
        status = data.get('status')
        
        if status not in ['pending', 'success', 'failed', 'expired', 'cancelled']:
            return jsonify({'error': 'Invalid status'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if code exists
        cursor.execute('SELECT * FROM deposit_codes WHERE id = ?', (code_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return jsonify({'error': 'Code not found'}), 404
        
        # Update status
        cursor.execute('UPDATE deposit_codes SET status = ? WHERE id = ?', (status, code_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Code updated successfully', 'status': status}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/deposit-codes/<code>/use', methods=['POST'])
def use_deposit_code(code):
    """Use a deposit code (process payment)"""
    try:
        import requests
        
        data = request.json
        user_id = data.get('userId')  # User who is using the code
        recipient_username = data.get('recipientUsername')  # For "send" type codes
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get code
        cursor.execute('SELECT * FROM deposit_codes WHERE code = ?', (code,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return jsonify({'error': 'Code not found'}), 404
        
        code_dict = code_to_dict(row)
        
        # Check if code is valid
        if code_dict['status'] != 'pending':
            conn.close()
            return jsonify({'error': f'Code is {code_dict["status"]}'}), 400
        
        # Check if expired
        now = datetime.now()
        expiry_date = datetime.fromisoformat(code_dict['expiryDate'])
        if expiry_date < now:
            cursor.execute('UPDATE deposit_codes SET status = ? WHERE id = ?', ('expired', code_dict['id']))
            conn.commit()
            conn.close()
            return jsonify({'error': 'Code has expired'}), 400
        
        # Check if user is trying to use their own code
        if code_dict['userId'] == user_id:
            conn.close()
            return jsonify({'error': 'You cannot use your own code'}), 400
        
        # For "send" type codes, transfer money from creator to recipient
        transfer_success = False
        transfer_error = None
        
        if code_dict['type'] == 'send' and recipient_username:
            # Get creator's token from database (sqlite3.Row doesn't have .get(), use try/except)
            creator_token = None
            if row:
                try:
                    creator_token = row['creator_token']
                except (KeyError, IndexError):
                    creator_token = None
            
            if creator_token:
                # Make transfer API call using creator's token
                try:
                    main_api_url = 'https://react-bank-project.eapi.joincoded.com/mini-project/api'
                    transfer_url = f'{main_api_url}/transactions/transfer/{recipient_username}'
                    
                    headers = {
                        'Authorization': f'Bearer {creator_token}',
                        'Content-Type': 'application/json'
                    }
                    payload = {'amount': code_dict['amount']}
                    
                    print(f'Making transfer: {creator_token[:20]}... -> {recipient_username} for {code_dict["amount"]} KD')
                    response = requests.put(transfer_url, json=payload, headers=headers, timeout=10)
                    
                    print(f'Transfer response: {response.status_code} - {response.text[:200]}')
                    
                    # Check if transfer was successful (status 200 and valid response)
                    if response.status_code == 200:
                        try:
                            response_json = response.json()
                            print(f'[DEBUG] Response JSON: {response_json}')
                            print(f'[DEBUG] Response text: {response.text}')
                            
                            # Check if response indicates success
                            # Look for "Transaction Done" in msg field (case-insensitive)
                            msg_value = response_json.get('msg', '')
                            msg_str = str(msg_value).lower() if msg_value else ''
                            
                            # Check multiple ways for success
                            has_transaction_done = 'transaction done' in msg_str
                            has_success_keyword = 'success' in msg_str
                            has_error_key = 'error' in response_json
                            
                            print(f'[DEBUG] msg_value: {msg_value}')
                            print(f'[DEBUG] msg_str: {msg_str}')
                            print(f'[DEBUG] has_transaction_done: {has_transaction_done}')
                            print(f'[DEBUG] has_success_keyword: {has_success_keyword}')
                            print(f'[DEBUG] has_error_key: {has_error_key}')
                            
                            # If we see "Transaction Done" or "success" in message, or no error field, it's a success
                            if has_transaction_done or has_success_keyword or (not has_error_key and response.status_code == 200):
                                transfer_success = True
                                print(f'[SUCCESS] Transfer successful! Setting transfer_success=True')
                            else:
                                transfer_error = response_json.get('error', response.text)
                                print(f'[FAILED] Transfer failed: {response_json}')
                        except Exception as json_error:
                            print(f'[DEBUG] JSON parsing error: {json_error}')
                            # If JSON parsing fails but status is 200, check text for "Transaction Done"
                            response_text = response.text.lower()
                            if 'transaction done' in response_text or 'success' in response_text:
                                transfer_success = True
                                print(f'[SUCCESS] Transfer successful! (Text response contains success: {response.text[:100]})')
                            else:
                                # If JSON parsing fails but status is 200, assume success (status 200 usually means success)
                                transfer_success = True
                                print(f'[SUCCESS] Transfer successful! (Non-JSON response, status 200)')
                    else:
                        try:
                            response_json = response.json()
                            transfer_error = response_json.get('error', response_json.get('msg', response.text))
                        except:
                            transfer_error = response.text
                        print(f'[FAILED] Transfer failed: {response.status_code} - {transfer_error}')
                except Exception as e:
                    transfer_error = str(e)
                    print(f'Transfer error: {e}')
                    import traceback
                    traceback.print_exc()
            else:
                transfer_error = 'Creator token not found'
                print(f'No creator token found for code {code_dict["id"]}')
        
        # Update code status based on transfer result
        print(f'[STATUS] Before status update: transfer_success={transfer_success}, type={code_dict["type"]}')
        if code_dict['type'] == 'send':
            if transfer_success:
                status = 'success'
                print(f'[STATUS] Setting status to SUCCESS for send code')
            else:
                status = 'failed'
                print(f'[STATUS] Setting status to FAILED for send code (transfer_success={transfer_success})')
        else:
            status = 'success'  # For "get" type, status is set after frontend transfer
            print(f'[STATUS] Setting status to SUCCESS for get code')
        
        # Update code status and mark as used
        used_at = datetime.now().isoformat()
        cursor.execute('''
            UPDATE deposit_codes 
            SET status = ?, used_by = ?, used_at = ? 
            WHERE id = ?
        ''', (status, user_id, used_at, code_dict['id']))
        
        conn.commit()
        conn.close()
        
        # Build response without exposing token
        code_response = {
            'id': code_dict['id'],
            'code': code_dict['code'],
            'amount': code_dict['amount'],
            'type': code_dict['type'],
            'expiryDate': code_dict['expiryDate'],
            'status': status,
            'createdAt': code_dict['createdAt'],
            'userId': code_dict['userId'],
            'recipientId': code_dict['recipientId'],
            'usedBy': user_id,
            'usedAt': used_at
        }
        
        # Ensure transferSuccess is a boolean True/False, not None for "send" type codes
        transfer_success_value = None
        if code_dict['type'] == 'send':
            transfer_success_value = bool(transfer_success)  # Explicitly convert to boolean
        
        response_data = {
            'message': 'Code used successfully' if transfer_success or code_dict['type'] == 'get' else 'Code processed but transfer failed',
            'code': code_response,
            'usedBy': user_id,
            'usedAt': used_at,
            'transferSuccess': transfer_success_value,
            'transferError': transfer_error if code_dict['type'] == 'send' and not transfer_success else None
        }
        
        print(f'[RESPONSE] Sending response for code {code_dict["code"]}:')
        print(f'   - Type: {code_dict["type"]}')
        print(f'   - Transfer Success: {transfer_success}')
        print(f'   - Transfer Error: {transfer_error}')
        print(f'   - Response transferSuccess: {response_data["transferSuccess"]}')
        print(f'   - Response transferError: {response_data["transferError"]}')
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Deposit codes API is running'}), 200

if __name__ == '__main__':
    print("Starting Deposit Codes API...")
    print("Database file:", DB_FILE)
    app.run(debug=True, host='0.0.0.0', port=5000)

