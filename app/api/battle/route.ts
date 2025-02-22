import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { battleName } = await request.json();
    
    // Convert battle name to filename format
    const fileName = battleName.toLowerCase()
      .replace(/^battle of /i, '')
      .replace(/\s+/g, '');
    
    // Read the battle report file
    const reportPath = path.join(process.cwd(), 'TestReports', `Test${fileName}`);
    const report = await fs.readFile(reportPath, 'utf-8');
    
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error processing battle request:', error);
    return NextResponse.json(
      { error: 'Failed to process battle data' },
      { status: 500 }
    );
  }
} 