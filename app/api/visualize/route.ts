import { NextResponse } from 'next/server';

interface DataPoint {
  label: string;
  value: number;
}

interface VisualizationRequest {
  type?: 'bar' | 'line' | 'pie' | 'table';
  data: DataPoint[];
  title?: string;
}

function chooseChartType(data: DataPoint[]): 'bar' | 'line' | 'pie' {
  // If 5 or fewer items, use pie chart
  if (data.length <= 5) {
    return 'pie';
  }
  
  // Check if labels look like dates or time periods
  const datePattern = /^\d{4}(-\d{2})?(-\d{2})?$|^Q[1-4]|^[A-Z][a-z]{2}/;
  const hasTimeLabels = data.some(item => datePattern.test(item.label));
  
  // If time-based data, use line chart
  if (hasTimeLabels) {
    return 'line';
  }
  
  // Default to bar chart for comparing values
  return 'bar';
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    console.log('📊 Visualization Request:', requestData);

    const { type, data, title }: VisualizationRequest = requestData;

    if (!Array.isArray(data)) {
      throw new Error('Data must be an array of data points');
    }

    // Choose the best chart type if not specified
    const chartType = type || chooseChartType(data);

    const result = {
      visualization: {
        type: chartType,
        title: title || 'Data Visualization',
        data: data
      }
    };

    console.log('📊 Visualization Result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Visualization Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create visualization' },
      { status: 500 }
    );
  }
}
