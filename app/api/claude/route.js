export async function POST(request) {
  try {
    const { model, system, prompt } = await request.json();
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 400 });
    }

    return Response.json({ 
      content: data.content[0]?.text || '' 
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return Response.json(
      { error: 'Failed to call Claude API' },
      { status: 500 }
    );
  }
}
