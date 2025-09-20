# -*- coding: utf-8 -*-
from flask_cors import CORS
import jwt
import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash

# Импортируем db из нашего независимого файла
from database import db
# Импортируем все наши модели
from models import User, Account, Category, Transaction

# --- APP CONFIGURATION ---
app = Flask(__name__)
CORS(app)
# Секретный ключ для подписи JWT токенов
app.config['SECRET_KEY'] = 'your_super_secret_key_change_in_production'
# Строка подключения к базе данных PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:221219997133Art@localhost/finance_app?client_encoding=utf8'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- DATABASE INITIALIZATION ---
# Связываем SQLAlchemy и Migrate с нашим Flask-приложением
db.init_app(app)
migrate = Migrate(app, db)


# --- AUTHENTICATION DECORATOR ---
# Наш "охранник", который проверяет наличие и валидность токена
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Проверяем, есть ли токен в заголовке x-access-token
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            # Расшифровываем токен с помощью нашего секретного ключа
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        # Передаём найденного пользователя в нашу функцию (эндпоинт)
        return f(current_user, *args, **kwargs)

    return decorated


# --- API ROUTES ---

@app.route('/')
def index():
    """Простой маршрут для проверки, что сервер работает."""
    return 'Привет! Сервер работает!'

# --- User Management ---

@app.route('/register', methods=['POST'])
def register():
    """Эндпоинт для регистрации нового пользователя."""
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'message': 'Missing data'}), 400

    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Username already exists'}), 409
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 409

    hashed_password = generate_password_hash(data.get('password'))

    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        password_hash=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'New user created!'}), 201

@app.route('/login', methods=['POST'])
def login():
    """Эндпоинт для входа пользователя и получения JWT токена."""
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing data'}), 400

    user = User.query.filter_by(username=data.get('username')).first()

    if not user or not check_password_hash(user.password_hash, data.get('password')):
        return jsonify({'message': 'Could not verify'}), 401

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token})

# --- Account Management ---

@app.route('/accounts', methods=['POST'])
@token_required
def create_account(current_user):
    """Создание нового счёта для залогиненного пользователя."""
    data = request.get_json()
    
    if not data or not data.get('name') or data.get('balance') is None:
        return jsonify({'message': 'Missing data'}), 400

    new_account = Account(
        name=data.get('name'),
        balance=int(float(data.get('balance')) * 100), # Переводим рубли в копейки
        owner=current_user
    )
    db.session.add(new_account)
    db.session.commit()
    
    return jsonify({'message': 'New account created!'}), 201

@app.route('/accounts', methods=['GET'])
@token_required
def get_accounts(current_user):
    """Получение списка всех счетов залогиненного пользователя."""
    accounts = Account.query.filter_by(user_id=current_user.id).all()
    
    output = []
    for account in accounts:
        account_data = {
            'id': account.id,
            'name': account.name,
            'balance': account.balance / 100 # Переводим копейки в рубли для отображения
        }
        output.append(account_data)
        
    return jsonify({'accounts': output})

# --- Category Management ---

@app.route('/setup', methods=['GET'])
def setup_categories():
    """(Разовый) Создаёт базовый набор категорий в БД."""
    if Category.query.filter_by(is_custom=False).first():
        return jsonify({'message': 'Base categories already exist.'})

    base_categories = [
        'Продукты', 'Транспорт', 'Жильё', 'Здоровье', 
        'Развлечения', 'Одежда', 'Образование', 'Зарплата', 'Подарки'
    ]
    for cat_name in base_categories:
        new_cat = Category(name=cat_name, is_custom=False)
        db.session.add(new_cat)
    
    db.session.commit()
    return jsonify({'message': 'Base categories created!'}), 201

@app.route('/categories', methods=['POST'])
@token_required
def create_category(current_user):
    """Создание кастомной категории для пользователя."""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Missing data'}), 400

    new_category = Category(name=data.get('name'), owner=current_user, is_custom=True)
    db.session.add(new_category)
    db.session.commit()

    return jsonify({'message': 'New category created!'}), 201

@app.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    """Получение списка всех базовых и личных категорий пользователя."""
    base_categories = Category.query.filter_by(is_custom=False).all()
    user_categories = Category.query.filter_by(user_id=current_user.id).all()

    output = []
    for category in base_categories + user_categories:
        category_data = {
            'id': category.id,
            'name': category.name,
            'is_custom': category.is_custom
        }
        output.append(category_data)
        
    return jsonify({'categories': output})

# --- Transaction Management ---

@app.route('/transactions', methods=['POST'])
@token_required
def create_transaction(current_user):
    """Создание транзакции и обновление баланса счёта."""
    data = request.get_json()
    
    required_fields = ['amount', 'type', 'account_id', 'category_id']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'message': 'Missing data'}), 400
    
    account = Account.query.filter_by(id=data.get('account_id'), user_id=current_user.id).first()
    if not account:
        return jsonify({'message': 'Account not found!'}), 404

    category = Category.query.filter(
        (Category.id == data.get('category_id')) & 
        ((Category.user_id == current_user.id) | (Category.is_custom == False))
    ).first()
    if not category:
        return jsonify({'message': 'Category not found!'}), 404

    amount_in_cents = int(float(data.get('amount')) * 100)
    
    if data.get('type') == 'expense':
        account.balance -= amount_in_cents
    elif data.get('type') == 'income':
        account.balance += amount_in_cents
    else:
        return jsonify({'message': 'Invalid transaction type'}), 400

    new_transaction = Transaction(
        amount=amount_in_cents,
        type=data.get('type'),
        comment=data.get('comment'),
        owner=current_user,
        account=account,
        category=category
    )
    
    db.session.add(new_transaction)
    db.session.commit()
    
    return jsonify({'message': 'Transaction created!'}), 201

@app.route('/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    """Получение списка всех транзакций пользователя."""
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.date.desc()).all()
    
    output = []
    for transaction in transactions:
        transaction_data = {
            'id': transaction.id,
            'amount': transaction.amount / 100,
            'type': transaction.type,
            'date': transaction.date,
            'comment': transaction.comment,
            'account_name': transaction.account.name,
            'category_name': transaction.category.name
        }
        output.append(transaction_data)
        
    return jsonify({'transactions': output})


# --- НОВЫЙ КОД ДЛЯ ОТЧЁТОВ ---

@app.route('/reports/expense-summary', methods=['GET'])
@token_required
def expense_summary(current_user):
    """
    Эндпоинт для получения суммарных расходов по категориям за всё время.
    """
    try:
        # Выполняем запрос к БД:
        # 1. Выбираем имя Категории и Сумму Транзакций.
        # 2. Объединяем (join) таблицы Транзакций и Категорий.
        # 3. Фильтруем транзакции: только расходы ('expense') и только для текущего пользователя.
        # 4. Группируем результаты по имени категории.
        summary = db.session.query(
            Category.name,
            db.func.sum(Transaction.amount)
        ).join(Category).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == 'expense'
        ).group_by(Category.name).all()

        report_data = []
        for category_name, total_amount in summary:
            report_data.append({
                'category': category_name,
                'total': total_amount / 100 # Переводим из копеек в рубли
            })
            
        return jsonify(report_data)

    except Exception as e:
        return jsonify({'message': 'Could not generate report', 'error': str(e)}), 500


# --- RUN APPLICATION ---
if __name__ == '__main__':
    app.run(debug=True)
