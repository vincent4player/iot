import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

// Enregistrement des composants ChartJS
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const WeatherChart = ({ title, data, color, gradient, unit }) => {
  const labels = data.map(item => item.time);
  const values = data.map(item => item.value);
  
  // Options pour le graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        color: '#1e293b',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.parsed.y} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value) {
            return value + ' ' + unit;
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear',
        from: 0.8,
        to: 0.2,
        loop: false
      }
    }
  };
  
  // Préparation des données pour le graphique
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        borderColor: color,
        backgroundColor: gradient ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
        borderWidth: 2,
        pointBackgroundColor: color,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.2,
        fill: gradient,
      },
    ],
  };

  return (
    <div className="chart-container">
      <div style={{ height: '300px' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export const TemperatureChart = ({ data }) => {
  return (
    <WeatherChart 
      title="Évolution de la température" 
      data={data} 
      color="#f97316" 
      gradient={true}
      unit="°C"
    />
  );
};

export const HumidityChart = ({ data }) => {
  return (
    <WeatherChart 
      title="Évolution de l'humidité" 
      data={data} 
      color="#0284c7" 
      gradient={true}
      unit="%"
    />
  );
};

export default WeatherChart; 