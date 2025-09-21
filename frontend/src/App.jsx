import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// --- НОВЫЙ ИМПОРТ ДЛЯ УВЕДОМЛЕНИЙ ---
import toast, { Toaster } from 'react-hot-toast';
import ReportsPage from './pages/ReportsPage';

// --- Стили ---
const styles = {
  // Стили для Layout
  layout: { display: 'flex', backgroundColor: '#111827', color: '#E5E7EB', fontFamily: "'Inter', sans-serif", minHeight: '100vh' },
  sidebar: { width: '250px', backgroundColor: '#1F2937', padding: '24px', borderRight: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: '16px' },
  sidebarLink: { color: '#9CA3AF', textDecoration: 'none', fontSize: '16px', fontWeight: '500', padding: '10px 16px', borderRadius: '8px', transition: 'background-color 0.2s, color 0.2s' },
  content: { flex: 1, padding: '40px', position: 'relative' },
  button: { padding: '10px 15px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  
  // Стили для Dashboard
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  accountsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
  accountCard: { padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, #1e3a8a, #3b0764)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)' },
  accountName: { margin: 0, fontSize: '18px', fontWeight: '600' },
  accountBalance: { margin: '8px 0 0 0', fontSize: '32px', fontWeight: '700' },
  transactionsSection: { marginTop: '40px' },
  transactionItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#1F2937', borderRadius: '8px', marginBottom: '12px' },
  transactionDetails: { display: 'flex', flexDirection: 'column', gap: '4px' },
  transactionCategory: { fontWeight: '600', fontSize: '16px' },
  transactionComment: { fontSize: '14px', color: '#9CA3AF' },
  transactionAmount: { fontSize: '18px', fontWeight: '600' },
  expense: { color: '#E5E7EB' },
  income: { color: '#10B981' },

  // Стили для Модального окна
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { width: '400px', padding: '32px', backgroundColor: '#1F2937', borderRadius: '12px', border: '1px solid #374151', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' },
  select: { padding: '12px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#111827', color: '#E5E7EB', fontSize: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#111827', color: '#E5E7EB', fontSize: '16px', outline: 'none' },

  // Стили для страницы входа
  authContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#c9d1d9', fontFamily: "'Inter', sans-serif", position: 'relative' },
  authFormCard: { width: '380px', padding: '32px', backgroundColor: 'rgba(22, 27, 34, 0.8)', borderRadius: '12px', border: '1px solid #30363d', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' },
  authTab: { flex: 1, padding: '12px 16px', cursor: 'pointer', color: '#8b949e', fontWeight: '600', textAlign: 'center', borderBottom: '2px solid transparent', transition: 'all 0.2s ease-in-out' },
  authActiveTab: { color: '#f0f6fc', borderBottom: '2px solid #58a6ff' },
  authButton: { padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #316dca, #238636)', color: 'white', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
};

// --- КОНТЕКСТ АУТЕНТИФИКАЦИИ ---
export const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  useEffect(() => {
    if (token) { localStorage.setItem('token', token); } else { localStorage.removeItem('token'); }
  }, [token]);
  const loginAction = async (data) => {
    const response = await axios.post("http://127.0.0.1:5000/login", data);
    if (response.data && response.data.token) { setToken(response.data.token); }
  };
  const logOutAction = () => { setToken(null); toast.success('Вы успешно вышли из системы'); };
  return (<AuthContext.Provider value={{ token, loginAction, logOutAction }}>{children}</AuthContext.Provider>);
};
const useAuth = () => useContext(AuthContext);

// --- Компоненты ---
const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login'); const [username, setUsername] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const { loginAction } = useAuth();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const isLogin = activeTab === 'login'; const url = 'http://127.0.0.1:5000/register'; const payload = { username, email, password };
    const loadingToast = toast.loading(isLogin ? 'Выполняем вход...' : 'Регистрация...');
    try {
      if (isLogin) {
        await loginAction({ username, password });
        toast.success('Вход выполнен успешно!', { id: loadingToast });
      } else {
        await axios.post(url, payload);
        toast.success('Регистрация прошла успешно! Теперь можете войти.', { id: loadingToast });
        setActiveTab('login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Не удалось выполнить операцию', { id: loadingToast });
    }
  };
  return (<div style={styles.authContainer}><div style={styles.authFormCard}><div style={{display:'flex', marginBottom:'24px', borderBottom:'1px solid #30363d'}}><div style={{...styles.authTab, ...(activeTab === 'login' ? styles.authActiveTab : {})}} onClick={() => setActiveTab('login')}>Вход</div><div style={{...styles.authTab, ...(activeTab === 'register' ? styles.authActiveTab : {})}} onClick={() => setActiveTab('register')}>Регистрация</div></div><form onSubmit={handleSubmit} style={styles.form}>{activeTab === 'register' && (<input style={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />)}<input style={styles.input} type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} /><input style={styles.input} type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="submit" style={styles.authButton}>{activeTab === 'login' ? 'Войти' : 'Создать аккаунт'}</button></form></div></div>);
};

const TransactionModal = ({ closeModal, accounts, categories, token, refreshData }) => {
  const [amount, setAmount] = useState(''); const [type, setType] = useState('expense'); const [accountId, setAccountId] = useState(accounts[0]?.id || ''); const [categoryId, setCategoryId] = useState(categories[0]?.id || ''); const [comment, setComment] = useState('');
  const handleSubmit = async (event) => {
    event.preventDefault();
    const loadingToast = toast.loading('Добавляем транзакцию...');
    try {
      await axios.post('http://127.0.0.1:5000/transactions', { amount: parseFloat(amount), type, account_id: parseInt(accountId), category_id: parseInt(categoryId), comment, }, { headers: { 'x-access-token': token } });
      toast.success('Транзакция успешно добавлена!', { id: loadingToast });
      refreshData();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Не удалось создать транзакцию', { id: loadingToast });
    }
  };
  return (<div style={styles.modalOverlay}><div style={styles.modalContent}><h2 style={{textAlign: 'center', marginTop: 0}}>Новая транзакция</h2><form onSubmit={handleSubmit} style={styles.form}><input style={styles.input} type="number" placeholder="Сумма" value={amount} onChange={e => setAmount(e.target.value)} /><select style={styles.select} value={type} onChange={e => setType(e.target.value)}><option value="expense">Расход</option><option value="income">Доход</option></select><select style={styles.select} value={accountId} onChange={e => setAccountId(e.target.value)}>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select><select style={styles.select} value={categoryId} onChange={e => setCategoryId(e.target.value)}>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select><input style={styles.input} type="text" placeholder="Комментарий" value={comment} onChange={e => setComment(e.target.value)} /><button type="submit" style={styles.button}>Добавить</button><button type="button" onClick={closeModal} style={{...styles.button, background: '#374151'}}>Отмена</button></form></div></div>);
};

const AccountCard = ({ account }) => {
  const formattedBalance = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(account.balance);
  return (<div style={styles.accountCard}><h3 style={styles.accountName}>{account.name}</h3><p style={styles.accountBalance}>{formattedBalance}</p></div>);
};

const TransactionList = ({ transactions }) => (
  <div style={styles.transactionsSection}>
    <h2>Последние операции</h2>
    {transactions.map(tx => (
      <div key={tx.id} style={styles.transactionItem}>
        <div style={styles.transactionDetails}><span style={styles.transactionCategory}>{tx.category_name}</span><span style={styles.transactionComment}>{tx.comment || 'Без комментария'}</span></div>
        <span style={{...styles.transactionAmount, ...(tx.type === 'income' ? styles.income : styles.expense)}}>{tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(tx.amount)}</span>
      </div>
    ))}
  </div>
);

const DashboardPage = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState([]); const [categories, setCategories] = useState([]); const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accountsRes, categoriesRes, transactionsRes] = await Promise.all([
        axios.get('http://127.0.0.1:5000/accounts', { headers: { 'x-access-token': token } }),
        axios.get('http://127.0.0.1:5000/categories', { headers: { 'x-access-token': token } }),
        axios.get('http://127.0.0.1:5000/transactions', { headers: { 'x-access-token': token } })
      ]);
      setAccounts(accountsRes.data.accounts); setCategories(categoriesRes.data.categories); setTransactions(transactionsRes.data.transactions);
    } catch (error) { console.error('Не удалось загрузить данные:', error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  return (
    <>
      {isModalOpen && <TransactionModal closeModal={() => setIsModalOpen(false)} accounts={accounts} categories={categories} token={token} refreshData={fetchData} />}
      <div style={styles.header}>
        <h1>Главный экран</h1>
        <button onClick={() => setIsModalOpen(true)} style={styles.button}>Добавить транзакцию</button>
      </div>
      
      {isLoading ? (<p>Загрузка...</p>) : (
        <>
          <div style={styles.accountsGrid}>
            {accounts.map(account => (<AccountCard key={account.id} account={account} />))}
          </div>
          <TransactionList transactions={transactions} />
        </>
      )}
    </>
  );
};



const Sidebar = () => (
    <div style={styles.sidebar}>
      <h3>Finance App</h3>
      <Link to="/" style={styles.sidebarLink}>Главный экран</Link>
      <Link to="/reports" style={styles.sidebarLink}>Отчёты</Link>
    </div>
);
  
const Layout = ({ children }) => (
    <div style={styles.layout}>
      <Sidebar />
      <main style={styles.content}>{children}</main>
    </div>
);

function App() {
  const { token, logOutAction } = useAuth();
  return (
    <Router>
      <Toaster 
        position="bottom-right"
        toastOptions={{ style: { background: '#1F2937', color: '#E5E7EB', border: '1px solid #374151' } }}
      />
      {token && <button onClick={logOutAction} style={{...styles.button, position: 'absolute', top: 20, right: 20, zIndex: 10}}>Выйти</button>}
      <Routes>
        {token ? (
          <Route path="/*" element={<Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/reports" element={<ReportsPage />} /></Routes></Layout>}/>
        ) : (
          <Route path="*" element={<AuthPage />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;

