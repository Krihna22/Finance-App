import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// --- Контекст для получения токена ---
// Мы импортируем AuthContext напрямую, чтобы получить доступ к токену
import { AuthContext } from '../App'; 

// --- Регистрация необходимых компонентов Chart.js ---
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Стили для страницы отчётов (чтобы соответствовать общему дизайну) ---
const styles = {
  reportsContainer: {
    width: '100%',
  },
  chartContainer: {
    maxWidth: '500px',
    maxHeight: '500px',
    margin: '40px auto',
    padding: '24px',
    backgroundColor: '#1F2937',
    borderRadius: '16px',
    border: '1px solid #374151',
  },
  loadingText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: '18px',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: '18px',
  },
  noDataText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: '18px',
    padding: '40px',
    backgroundColor: '#1F2937',
    borderRadius: '12px',
  }
};

const ReportsPage = () => {
  const { token } = React.useContext(AuthContext); // Используем useContext для доступа к токену
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const response = await axios.get('http://127.0.0.1:5000/reports/expense-summary', {
          headers: { 'x-access-token': token }
        });
        
        // Преобразуем данные для графика
        const labels = response.data.map(item => item.category);
        const data = response.data.map(item => item.total);

        setReportData({
          labels: labels,
          datasets: [
            {
              label: 'Расходы',
              data: data,
              backgroundColor: [
                '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
                '#3B82F6', '#EC4899', '#6EE7B7', '#FBBF24', '#F87171'
              ],
              borderColor: '#1F2937',
              borderWidth: 3,
            },
          ],
        });
      } catch (err) {
        setError('Не удалось загрузить данные для отчёта.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [token]);

  if (isLoading) {
    return <p style={styles.loadingText}>Загрузка отчёта...</p>;
  }

  if (error) {
    return <p style={styles.errorText}>{error}</p>;
  }
  
  // Проверяем, есть ли данные для отображения
  if (!reportData || reportData.datasets[0].data.length === 0) {
    return (
        <div style={styles.reportsContainer}>
            <h1>Отчёты</h1>
            <div style={styles.noDataText}>
                <p>У вас пока нет расходов для построения отчёта.</p>
                <p>Добавьте несколько транзакций, чтобы увидеть здесь график.</p>
            </div>
        </div>
    );
  }

  return (
    <div style={styles.reportsContainer}>
      <h1>Отчёты</h1>
      <p style={{color: '#9CA3AF', marginBottom: '20px'}}>Структура ваших расходов за всё время.</p>
      <div style={styles.chartContainer}>
        <Doughnut 
            data={reportData} 
            options={{
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#E5E7EB'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }}
        />
      </div>
    </div>
  );
};

export default ReportsPage;