import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTranslationService } from '@/lib/translation';

/**
 * 🚀 ENTERPRISE TRANSLATION METRICS API
 * Provides real-time performance monitoring for LinguaLink AI
 * 
 * GET /api/translation/metrics
 * Returns comprehensive translation service metrics including:
 * - Request volume and success rates
 * - Average response times
 * - Cache hit rates
 * - API usage distribution
 * - Performance trends
 */

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get performance metrics from translation service
    const translationService = getTranslationService();
    const metrics = translationService.getPerformanceMetrics();
    
    // Calculate additional derived metrics
    const successRate = metrics.totalRequests > 0 
      ? (metrics.successfulTranslations / metrics.totalRequests) * 100 
      : 0;
    
    const failureRate = metrics.totalRequests > 0 
      ? (metrics.failedTranslations / metrics.totalRequests) * 100 
      : 0;

    const cacheHitRatePercent = metrics.cacheHitRate * 100;

    // API usage distribution
    const totalApiCalls = metrics.apiUsage.translator1 + metrics.apiUsage.translator2;
    const translator1Percentage = totalApiCalls > 0 
      ? (metrics.apiUsage.translator1 / totalApiCalls) * 100 
      : 0;
    const translator2Percentage = totalApiCalls > 0 
      ? (metrics.apiUsage.translator2 / totalApiCalls) * 100 
      : 0;

    // Enhanced metrics response
    const enhancedMetrics = {
      // Core Metrics
      totalRequests: metrics.totalRequests,
      successfulTranslations: metrics.successfulTranslations,
      failedTranslations: metrics.failedTranslations,
      
      // Performance Metrics
      averageResponseTime: Math.round(metrics.averageResponseTime),
      cacheHitRate: Math.round(cacheHitRatePercent * 100) / 100, // Round to 2 decimal places
      
      // Success/Failure Rates
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      
      // API Usage Distribution
      apiUsage: {
        featherlessAI: {
          requests: metrics.apiUsage.translator1,
          percentage: Math.round(translator1Percentage * 100) / 100
        },
        openAI: {
          requests: metrics.apiUsage.translator2,
          percentage: Math.round(translator2Percentage * 100) / 100
        }
      },
      
      // System Health Indicators
      systemHealth: {
        status: successRate >= 95 ? 'excellent' : 
                successRate >= 90 ? 'good' : 
                successRate >= 80 ? 'fair' : 'poor',
        responseTimeStatus: metrics.averageResponseTime < 1000 ? 'fast' :
                           metrics.averageResponseTime < 3000 ? 'moderate' : 'slow',
        cacheEfficiency: cacheHitRatePercent >= 30 ? 'high' :
                        cacheHitRatePercent >= 15 ? 'moderate' : 'low'
      },
      
      // Timestamp
      timestamp: new Date().toISOString(),
      
      // Service Information
      serviceInfo: {
        name: 'LinguaLink AI Translation Service',
        version: '2.0.0',
        supportedLanguages: 112,
        features: [
          'Real-time Translation',
          'Advanced Caching',
          'Dual-Provider Redundancy',
          'Performance Monitoring',
          'Auto Language Detection',
          'Cultural Context Awareness'
        ]
      }
    };

    console.log(`📊 Translation metrics requested by user: ${userId}`);
    console.log(`📈 Current performance: ${successRate.toFixed(1)}% success rate, ${metrics.averageResponseTime.toFixed(0)}ms avg response`);

    return NextResponse.json(enhancedMetrics);

  } catch (error) {
    console.error('❌ Error fetching translation metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation metrics' }, 
      { status: 500 }
    );
  }
}

/**
 * 🔄 RESET METRICS (Admin only)
 * POST /api/translation/metrics/reset
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Note: In a production environment, you'd want to check for admin privileges here
    // For now, any authenticated user can reset metrics (useful for development)
    
    console.log(`🔄 Translation metrics reset requested by user: ${userId}`);
    
    return NextResponse.json({ 
      message: 'Metrics reset functionality would be implemented here',
      note: 'In production, this would require admin privileges'
    });

  } catch (error) {
    console.error('❌ Error resetting translation metrics:', error);
    return NextResponse.json(
      { error: 'Failed to reset translation metrics' }, 
      { status: 500 }
    );
  }
}
