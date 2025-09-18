from app import db
from datetime import datetime # Нам понадобится для работы с датами

# Модель Пользователя (уже была)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # Связи (у одного юзера много счетов, транзакций и категорий)
    accounts = db.relationship('Account', backref='owner', lazy=True)
    transactions = db.relationship('Transaction', backref='owner', lazy=True)
    categories = db.relationship('Category', backref='owner', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

# --- НОВЫЙ КОД НИЖЕ ---

# Модель Счёта
class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    balance = db.Column(db.Integer, nullable=False, default=0) # Храним в копейках
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # Ссылка на владельца
    
    transactions = db.relationship('Transaction', backref='account', lazy=True)

    def __repr__(self):
        return f'<Account {self.name}>'

# Модель Категории
class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    is_custom = db.Column(db.Boolean, default=True, nullable=False) # Категория создана юзером?
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # null=True для базовых категорий

    transactions = db.relationship('Transaction', backref='category', lazy=True)

    def __repr__(self):
        return f'<Category {self.name}>'

# Модель Транзакции
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Integer, nullable=False) # Сумма в копейках
    type = db.Column(db.String(10), nullable=False) # 'income' или 'expense'
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    comment = db.Column(db.String(255), nullable=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)

    def __repr__(self):
        return f'<Transaction {self.id}>'