from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:221219997133Art@localhost/finance_app?client_encoding=utf8'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Импортируем модели здесь, В САМОМ НИЗУ, после инициализации db
from models import User, Account, Category, Transaction

@app.route('/')
def index():
    return 'Привет! Теперь сервер настроен для работы с базой данных!'

if __name__ == '__main__':
    app.run(debug=True)