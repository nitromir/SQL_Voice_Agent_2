function chooseChartType(data) {
  if (data.length <= 5) {
    return 'pie';
  }
  
  const datePattern = /^\d{4}(-\d{2})?(-\d{2})?$|^Q[1-4]|^[A-Z][a-z]{2}/;
  const hasTimeLabels = data.some(item => datePattern.test(item.label));
  
  if (hasTimeLabels) {
    return 'line';
  }
  
  return 'bar';
}

exports.handler = async function(event, context) {
  try {
    const { type, data, title } = JSON.parse(event.body);

    if (!Array.isArray(data)) {
      throw new Error('Data must be an array of data points');
    }

    const result = {
      visualization: {
        type: type || chooseChartType(data),
        title: title || 'Data Visualization',
        data: data
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Visualization Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to create visualization' 
      })
    };
  }
};