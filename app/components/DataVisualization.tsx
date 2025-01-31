import { useEffect, useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie,
  Cell,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DataPoint {
  label: string;
  value: number;
}

interface DataVisualizationProps {
  visualization: {
    type: string;
    title: string;
    data: DataPoint[];
  };
}

const COLORS = ['#ffc000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffcc5c'];

export default function DataVisualization({ visualization }: DataVisualizationProps) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setShow(true);
    return () => setShow(false);
  }, []);

  const formattedData = visualization.data.map(item => ({
    name: item.label,
    value: item.value
  }));

  const renderChart = () => {
    switch (visualization.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,192,0,0.3)',
                  color: '#fff' 
                }} 
              />
              <Legend />
              <Bar dataKey="value" fill="#ffc000" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,192,0,0.3)',
                  color: '#fff' 
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#ffc000" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,192,0,0.3)',
                  color: '#fff' 
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '90%',
      maxWidth: '800px',
      margin: '0 auto',
      background: 'rgba(0, 0, 0, 0.9)',
      padding: '1.5rem',
      borderRadius: '1rem',
      color: '#ffc000',
      border: '1px solid rgba(255, 192, 0, 0.3)',
      boxShadow: '0 0 30px rgba(255, 192, 0, 0.15)',
      opacity: show ? 1 : 0,
      transform: `scale(${show ? 1 : 0.9})`,
      transition: 'all 0.3s ease-out',
      marginBottom: '2rem',
    }}>
      <h3 style={{
        fontSize: '1.4rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textAlign: 'center',
        textShadow: '0 0 10px rgba(255, 192, 0, 0.2)',
      }}>{visualization.title}</h3>
      {renderChart()}
    </div>
  );
}
