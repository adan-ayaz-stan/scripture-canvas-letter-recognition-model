import React from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface MetricChartProps {
  metrics: Record<string, number>;
  prediction: string;
}

const MetricChart: React.FC<MetricChartProps> = ({ metrics, prediction }) => {
  // Convert metrics object to array and sort by probability
  const data = Object.entries(metrics)
    .map(([letter, probability]) => ({
      letter,
      probability: probability * 100, // Convert to percentage
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5); // Take top 5

  return (
    <Card className="w-full h-full border-none shadow-none bg-transparent">
      <CardHeader className="p-2 pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
          Confidence Metrics (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis
              dataKey="letter"
              type="category"
              width={20}
              tick={{ fontSize: 12, fontWeight: "bold" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number) => [
                `${value.toFixed(1)}%`,
                "Confidence",
              ]}
            />
            <Bar dataKey="probability" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.letter === prediction
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)"
                  }
                  opacity={entry.letter === prediction ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MetricChart;
