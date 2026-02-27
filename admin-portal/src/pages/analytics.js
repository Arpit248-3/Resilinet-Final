import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Analytics = ({ alerts }) => {
  const counts = alerts.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(counts),
    datasets: [{
      label: 'Signal Count',
      data: Object.values(counts),
      backgroundColor: ['#ff3e3e', '#00f2ff', '#ffaa00', '#4dff88', '#9966ff'],
      hoverOffset: 20, // Interactive pop-out effect
      borderColor: '#0a0a0b',
      borderWidth: 3
    }]
  };

  const options = {
    plugins: {
      legend: { position: 'bottom', labels: { color: '#e0e0e0', font: { size: 14 } } },
      tooltip: { backgroundColor: '#16161a', titleColor: '#00f2ff', bodyColor: '#fff', padding: 15 }
    },
    maintainAspectRatio: false
  };

  return (
    <div style={{ background: '#16161a', padding: '40px', borderRadius: '15px', height: '80vh', textAlign: 'center' }}>
      <h2 style={{ color: '#00f2ff', marginBottom: '30px' }}>📊 EMERGENCY DATA INSIGHTS</h2>
      <div style={{ height: '70%', position: 'relative' }}>
        {alerts.length > 0 ? <Doughnut data={data} options={options} /> : <p style={{color:'#666'}}>No Data Logged</p>}
      </div>
    </div>
  );
};

export default Analytics;