import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';

// --- Стили ---
const styles = {
  // ... (все предыдущие стили container, formCard, и т.д. остаются здесь) ...
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#c9d1d9', fontFamily: "'Inter', sans-serif", position: 'relative' },
  formCard: { width: '380px', padding: '32px', backgroundColor: 'rgba(22, 27, 34, 0.8)', borderRadius: '12px', border: '1px solid #30363d', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' },
  tabsContainer: { display: 'flex', marginBottom: '24px', borderBottom: '1px solid #30363d' },
  tab: { flex: 1, padding: '12px 16px', cursor: 'pointer', color: '#8b949e', fontWeight: '600', textAlign: 'center', borderBottom: '2px solid transparent', transition: 'all 0.2s ease-in-out' },
  activeTab: { color: '#f0f6fc', borderBottom: '2px solid #58a6ff' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: '#f0f6fc', fontSize: '16px', outline: 'none' },
  button: { padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #316dca, #238636)', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  langSelectorContainer: { position: 'absolute', top: '20px', right: '20px' },
  langSelector: { cursor: 'pointer' },
  langDropdown: { position: 'absolute', top: '40px', right: '0', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '8px', zIndex: 10, width: '120px' },
  langOption: { padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', color: '#c9d1d9' },
  dashboardContainer: { width: '100%', maxWidth: '1200px', padding: '40px', boxSizing: 'border-box', },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  accountsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
  accountCard: { padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, #1e3a8a, #3b0764)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' },
  accountName: { margin: 0, fontSize: '18px', fontWeight: '600' },
  accountBalance: { margin: '8px 0 0 0', fontSize: '32px', fontWeight: '700' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, },
  modalContent: { width: '400px', padding: '32px', backgroundColor: '#161b22', borderRadius: '12px', border: '1px solid #30363d', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', },
  select: { padding: '12px', borderRadius: '8px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: '#f0f6fc', fontSize: '16px', },

  // --- НОВЫЕ СТИЛИ ДЛЯ СПИСКА ТРАНЗАКЦИЙ ---
  transactionsSection: {
    marginTop: '40px',
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#161b22',
    borderRadius: '8px',
    border: '1px solid #30363d',
    marginBottom: '12px',
  },
  transactionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  transactionCategory: {
    fontWeight: '600',
    fontSize: '16px',
  },
  transactionComment: {
    fontSize: '14px',
    color: '#8b949e',
  },
  transactionAmount: {
    fontSize: '18px',
    fontWeight: '600',
  },
  expense: {
    color: '#f0f6fc', // Белый для расходов
  },
  income: {
    color: '#3fb950', // Зелёный для доходов
  },
};

// --- КОНТЕКСТ АУТЕНТИФИКАЦИИ (без изменений) ---
// ... (весь код AuthContext, AuthProvider, useAuth остаётся здесь) ...
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  useEffect(() => {
    if (token) { localStorage.setItem('token', token); } else { localStorage.removeItem('token'); }
  }, [token]);
  const loginAction = async (data) => {
    const response = await axios.post("http://127.0.0.1:5000/login", data);
    if (response.data && response.data.token) { setToken(response.data.token); return response; }
  };
  const logOutAction = () => { setToken(null); };
  return (<AuthContext.Provider value={{ token, loginAction, logOutAction }}>{children}</AuthContext.Provider>);
};
const useAuth = () => { return useContext(AuthContext); };


// --- Компоненты (без изменений) ---
// ... (GlobeIcon, LanguageSelector, AuthTabs, Input, AuthPage) ...
const GlobeIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>);
const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false); const dropdownRef = useRef(null);
  useEffect(() => { const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
  return (<div style={styles.langSelectorContainer} ref={dropdownRef}><div style={styles.langSelector} onClick={() => setIsOpen(!isOpen)}><GlobeIcon /></div>{isOpen && (<div style={styles.langDropdown}><div style={styles.langOption}>Русский</div><div style={styles.langOption}>English</div><div style={styles.langOption}>Español</div></div>)}</div>);
};
const AuthTabs = ({ activeTab, setActiveTab }) => ( <div style={styles.tabsContainer}><div style={{ ...styles.tab, ...(activeTab === 'login' ? styles.activeTab : {}) }} onClick={() => setActiveTab('login')}>Вход</div><div style={{ ...styles.tab, ...(activeTab === 'register' ? styles.activeTab : {}) }} onClick={() => setActiveTab('register')}>Регистрация</div></div>);
const Input = (props) => <input style={styles.input} {...props} />;
const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login'); const [username, setUsername] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const { loginAction } = useAuth();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const isLogin = activeTab === 'login'; const url = 'http://127.0.0.1:5000/register'; const payload = { username, email, password };
    try { if (isLogin) { await loginAction({ username, password }); } else { await axios.post(url, payload); alert('Регистрация прошла успешно! Теперь можете войти.'); setActiveTab('login'); } } catch (error) { alert(`Ошибка: ${error.response ? error.response.data.message : 'Не удалось подключиться к серверу'}`); }
  };
  return (<div style={styles.container}><LanguageSelector /><div style={styles.formCard}><AuthTabs activeTab={activeTab} setActiveTab={setActiveTab} /><form onSubmit={handleSubmit} style={styles.form}>{activeTab === 'register' && (<Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />)}<Input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} /><Input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="submit" style={styles.button}>{activeTab === 'login' ? 'Войти' : 'Создать аккаунт'}</button></form></div></div>);
};
const TransactionModal = ({ closeModal, accounts, categories, token, refreshData }) => { /* ... код без изменений ... */
  const [amount, setAmount] = useState(''); const [type, setType] = useState('expense'); const [accountId, setAccountId] = useState(accounts[0]?.id || ''); const [categoryId, setCategoryId] = useState(categories[0]?.id || ''); const [comment, setComment] = useState('');
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post('http://127.0.0.1:5000/transactions', { amount: parseFloat(amount), type, account_id: parseInt(accountId), category_id: parseInt(categoryId), comment, }, { headers: { 'x-access-token': token } } );
      alert('Транзакция добавлена!'); refreshData(); closeModal();
    } catch (error) { alert(`Ошибка: ${error.response?.data?.message || 'Не удалось создать транзакцию'}`); }
  };
  return (<div style={styles.modalOverlay}><div style={styles.modalContent}><h2 style={{textAlign: 'center', marginTop: 0}}>Новая транзакция</h2><form onSubmit={handleSubmit} style={styles.form}><Input type="number" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} /><select style={styles.select} value={type} onChange={e => setType(e.target.value)}><option value="expense">Расход</option><option value="income">Доход</option></select><select style={styles.select} value={accountId} onChange={e => setAccountId(e.target.value)}>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select><select style={styles.select} value={categoryId} onChange={e => setCategoryId(e.target.value)}>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select><Input type="text" placeholder="Комментарий" value={comment} onChange={e => setComment(e.target.value)} /><button type="submit" style={styles.button}>Добавить</button><button type="button" onClick={closeModal} style={{...styles.button, background: '#333'}}>Отмена</button></form></div></div>);
};
const AccountCard = ({ account }) => { /* ... код без изменений ... */
  const formattedBalance = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(account.balance);
  return (<div style={styles.accountCard}><h3 style={styles.accountName}>{account.name}</h3><p style={styles.accountBalance}>{formattedBalance}</p></div>);
};


// --- НОВЫЙ КОМПОНЕНТ: СПИСОК ТРАНЗАКЦИЙ ---
const TransactionList = ({ transactions }) => {
  return (
    <div style={styles.transactionsSection}>
      <h2>Последние операции</h2>
      {transactions.map(tx => (
        <div key={tx.id} style={styles.transactionItem}>
          <div style={styles.transactionDetails}>
            <span style={styles.transactionCategory}>{tx.category_name}</span>
            <span style={styles.transactionComment}>{tx.comment || 'Без комментария'}</span>
          </div>
          <span style={{...styles.transactionAmount, ...(tx.type === 'income' ? styles.income : styles.expense)}}>
            {tx.type === 'income' ? '+' : '-'}
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(tx.amount)}
          </span>
        </div>
      ))}
    </div>
  );
};


// --- ОБНОВЛЁННЫЙ КОМПОНЕНТ DASHBOARD ---
const Dashboard = () => {
  const { logOutAction, token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]); // <-- Добавили состояние для транзакций
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Обновляем функцию, чтобы она загружала всё сразу
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Запрашиваем всё параллельно для скорости
      const [accountsRes, categoriesRes, transactionsRes] = await Promise.all([
        axios.get('http://127.0.0.1:5000/accounts', { headers: { 'x-access-token': token } }),
        axios.get('http://127.0.0.1:5000/categories', { headers: { 'x-access-token': token } }),
        axios.get('http://127.0.0.1:5000/transactions', { headers: { 'x-access-token': token } })
      ]);
      setAccounts(accountsRes.data.accounts);
      setCategories(categoriesRes.data.categories);
      setTransactions(transactionsRes.data.transactions); // <-- Сохраняем транзакции
    } catch (error) {
      console.error('Не удалось загрузить данные:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <div style={styles.container}>
      {isModalOpen && <TransactionModal closeModal={() => setIsModalOpen(false)} accounts={accounts} categories={categories} token={token} refreshData={fetchData}/>}
      <div style={styles.dashboardContainer}>
        <div style={styles.header}>
          <h1>Главный экран</h1>
          <div>
            <button onClick={() => setIsModalOpen(true)} style={{...styles.button, marginRight: '15px'}}>Добавить транзакцию</button>
            <button onClick={logOutAction} style={styles.button}>Выйти</button>
          </div>
        </div>
        <hr />
        <h2>Мои Счета</h2>
        {isLoading ? (<p>Загрузка...</p>) : (
          <>
            <div style={styles.accountsGrid}>
              {accounts.map(account => (<AccountCard key={account.id} account={account} />))}
            </div>
            {/* <-- Добавляем список транзакций ниже --> */}
            <TransactionList transactions={transactions} />
          </>
        )}
      </div>
    </div>
  );
};


// --- ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ (без изменений) ---
function App() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <AuthPage />;
}

export default App;