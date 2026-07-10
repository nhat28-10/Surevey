import { HelperResponse, ChartDataPoint } from './types';
import { computeDeviceBreakdown, computeBrowserBreakdown, computeCountryBreakdown } from './mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316', '#ec4899'];

interface ResponseChartsProps {
  responses: HelperResponse[];
}

function DevicePieChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">Thiết bị</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={70}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val: number) => [val, 'Người']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function BrowserBarChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">Trình duyệt</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(val: number) => [val, 'Người']} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CountryBarChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">Quốc gia / Khu vực</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data.slice(0, 6)}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 60, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={56} />
            <Tooltip formatter={(val: number) => [val, 'Người']} />
            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ResponseCharts({ responses }: ResponseChartsProps) {
  const deviceData = computeDeviceBreakdown(responses);
  const browserData = computeBrowserBreakdown(responses);
  const countryData = computeCountryBreakdown(responses);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Phân tích người tham gia</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DevicePieChart data={deviceData} />
        <BrowserBarChart data={browserData} />
        <CountryBarChart data={countryData} />
      </div>
    </div>
  );
}
