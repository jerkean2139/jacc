import puppeteer from 'puppeteer';
import { sendEmail } from './sendgrid';
import { db } from './db';
import { pdfReports } from '@shared/schema';

export interface ReportData {
  merchantProfile: {
    businessName: string;
    dba?: string;
    industry: string;
    monthlyVolume: number;
    averageTicket: number;
    transactionCount: number;
  };
  currentProcessor?: any;
  proposedProcessor: any;
  costs: {
    current?: any;
    proposed: any;
    savings?: any;
  };
  hardware?: any[];
  recommendations?: string[];
  analysisDate: string;
  agentName: string;
  agentEmail: string;
}

export class PDFReportGenerator {
  private brandColors = {
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#10b981',
    text: '#1f2937',
    lightGray: '#f3f4f6'
  };

  async generateComparisonReport(data: ReportData): Promise<Buffer> {
    const html = this.generateComparisonHTML(data);
    return await this.generatePDF(html, 'comparison');
  }

  async generateSavingsReport(data: ReportData): Promise<Buffer> {
    const html = this.generateSavingsHTML(data);
    return await this.generatePDF(html, 'savings');
  }

  async generateProposalReport(data: ReportData): Promise<Buffer> {
    const html = this.generateProposalHTML(data);
    return await this.generatePDF(html, 'proposal');
  }

  private generateComparisonHTML(data: ReportData): string {
    const { merchantProfile, currentProcessor, proposedProcessor, costs, hardware, analysisDate, agentName } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Merchant Services Comparison Report</title>
        <style>
            ${this.getBaseCSS()}
            
            .comparison-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
            }
            
            .processor-card {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 25px;
                background: #f9fafb;
            }
            
            .processor-card.current {
                border-color: #ef4444;
                background: #fef2f2;
            }
            
            .processor-card.proposed {
                border-color: #10b981;
                background: #f0fdf4;
            }
            
            .cost-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .savings-highlight {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                margin: 30px 0;
            }
        </style>
    </head>
    <body>
        ${this.getHeaderHTML(merchantProfile.businessName, 'Processor Comparison Report', analysisDate, agentName)}
        
        <div class="content">
            <section class="merchant-info">
                <h2>Business Overview</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Business Name:</strong> ${merchantProfile.businessName}
                        ${merchantProfile.dba ? `<br><strong>DBA:</strong> ${merchantProfile.dba}` : ''}
                    </div>
                    <div class="info-item">
                        <strong>Industry:</strong> ${merchantProfile.industry}
                    </div>
                    <div class="info-item">
                        <strong>Monthly Volume:</strong> $${merchantProfile.monthlyVolume.toLocaleString()}
                    </div>
                    <div class="info-item">
                        <strong>Average Ticket:</strong> $${merchantProfile.averageTicket.toFixed(2)}
                    </div>
                    <div class="info-item">
                        <strong>Monthly Transactions:</strong> ${merchantProfile.transactionCount.toLocaleString()}
                    </div>
                </div>
            </section>

            ${costs.savings ? `
            <div class="savings-highlight">
                <h2 style="margin: 0 0 10px 0;">Potential Monthly Savings</h2>
                <div style="font-size: 48px; font-weight: bold;">$${Math.abs(costs.savings.monthly).toFixed(2)}</div>
                <div style="font-size: 18px; opacity: 0.9;">Annual Savings: $${Math.abs(costs.savings.annual).toFixed(0)}</div>
            </div>
            ` : ''}

            <section class="comparison-section">
                <h2>Processor Comparison</h2>
                <div class="comparison-grid">
                    ${currentProcessor ? `
                    <div class="processor-card current">
                        <h3>Current Processor</h3>
                        <h4>${currentProcessor.name}</h4>
                        <div class="cost-breakdown">
                            <div class="cost-item">
                                <span>Monthly Cost:</span>
                                <strong>$${costs.current.totalMonthlyCost.toFixed(2)}</strong>
                            </div>
                            <div class="cost-item">
                                <span>Effective Rate:</span>
                                <strong>${(costs.current.effectiveRate * 100).toFixed(2)}%</strong>
                            </div>
                            <div class="cost-item">
                                <span>Annual Cost:</span>
                                <strong>$${costs.current.annualCost.toFixed(0)}</strong>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="processor-card proposed">
                        <h3>Proposed Processor</h3>
                        <h4>${proposedProcessor.name}</h4>
                        <div class="cost-breakdown">
                            <div class="cost-item">
                                <span>Monthly Cost:</span>
                                <strong>$${costs.proposed.totalMonthlyCost.toFixed(2)}</strong>
                            </div>
                            <div class="cost-item">
                                <span>Effective Rate:</span>
                                <strong>${(costs.proposed.effectiveRate * 100).toFixed(2)}%</strong>
                            </div>
                            <div class="cost-item">
                                <span>Annual Cost:</span>
                                <strong>$${costs.proposed.annualCost.toFixed(0)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            ${hardware && hardware.length > 0 ? `
            <section class="hardware-section">
                <h2>Recommended Hardware</h2>
                <div class="hardware-grid">
                    ${hardware.map(item => `
                    <div class="hardware-item">
                        <h4>${item.name}</h4>
                        <p><strong>Manufacturer:</strong> ${item.manufacturer}</p>
                        <p><strong>Model:</strong> ${item.model}</p>
                        <p><strong>Monthly Lease:</strong> $${(item.monthlyLease || 0).toFixed(2)}</p>
                        <p><strong>Purchase Price:</strong> $${item.price.toFixed(2)}</p>
                    </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            ${data.recommendations && data.recommendations.length > 0 ? `
            <section class="recommendations">
                <h2>Recommendations</h2>
                <ul>
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </section>
            ` : ''}
        </div>

        ${this.getFooterHTML()}
    </body>
    </html>
    `;
  }

  private generateSavingsHTML(data: ReportData): string {
    const { merchantProfile, costs, analysisDate, agentName } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Savings Analysis Report</title>
        <style>
            ${this.getBaseCSS()}
            
            .savings-dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .metric-card {
                background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                border: 2px solid #10b981;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
            }
            
            .metric-value {
                font-size: 32px;
                font-weight: bold;
                color: #059669;
                margin: 10px 0;
            }
            
            .metric-label {
                font-size: 14px;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        </style>
    </head>
    <body>
        ${this.getHeaderHTML(merchantProfile.businessName, 'Savings Analysis Report', analysisDate, agentName)}
        
        <div class="content">
            <section class="merchant-info">
                <h2>Business Profile</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Business:</strong> ${merchantProfile.businessName}
                    </div>
                    <div class="info-item">
                        <strong>Monthly Volume:</strong> $${merchantProfile.monthlyVolume.toLocaleString()}
                    </div>
                    <div class="info-item">
                        <strong>Industry:</strong> ${merchantProfile.industry}
                    </div>
                </div>
            </section>

            <section class="savings-analysis">
                <h2>Savings Analysis</h2>
                <div class="savings-dashboard">
                    <div class="metric-card">
                        <div class="metric-label">Monthly Savings</div>
                        <div class="metric-value">$${Math.abs(costs.savings.monthly).toFixed(2)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Annual Savings</div>
                        <div class="metric-value">$${Math.abs(costs.savings.annual).toFixed(0)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Payback Period</div>
                        <div class="metric-value">${costs.savings.paybackPeriod.toFixed(1)}</div>
                        <div style="font-size: 12px; color: #6b7280;">months</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">ROI</div>
                        <div class="metric-value">${costs.savings.roi.toFixed(0)}%</div>
                    </div>
                </div>
            </section>

            ${costs.savings.breakdownAnalysis ? `
            <section class="breakdown-analysis">
                <h2>Cost Breakdown Analysis</h2>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <h4>Processing Cost Savings</h4>
                        <div class="breakdown-value">$${Math.abs(costs.savings.breakdownAnalysis.processingCostSavings).toFixed(2)}</div>
                    </div>
                    <div class="breakdown-item">
                        <h4>Monthly Fee Savings</h4>
                        <div class="breakdown-value">$${Math.abs(costs.savings.breakdownAnalysis.feeSavings).toFixed(2)}</div>
                    </div>
                    <div class="breakdown-item">
                        <h4>Equipment Savings</h4>
                        <div class="breakdown-value">$${Math.abs(costs.savings.breakdownAnalysis.equipmentSavings).toFixed(2)}</div>
                    </div>
                </div>
            </section>
            ` : ''}
        </div>

        ${this.getFooterHTML()}
    </body>
    </html>
    `;
  }

  private generateProposalHTML(data: ReportData): string {
    const { merchantProfile, proposedProcessor, costs, hardware, analysisDate, agentName } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Merchant Services Proposal</title>
        <style>
            ${this.getBaseCSS()}
            
            .proposal-header {
                background: linear-gradient(135deg, ${this.brandColors.primary}, ${this.brandColors.secondary});
                color: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                margin: 30px 0;
            }
            
            .proposal-sections {
                display: grid;
                gap: 30px;
            }
            
            .section {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 30px;
            }
        </style>
    </head>
    <body>
        ${this.getHeaderHTML(merchantProfile.businessName, 'Merchant Services Proposal', analysisDate, agentName)}
        
        <div class="content">
            <div class="proposal-header">
                <h1>Merchant Services Proposal</h1>
                <p style="font-size: 18px; margin: 20px 0 0 0;">
                    Customized payment processing solution for ${merchantProfile.businessName}
                </p>
            </div>

            <div class="proposal-sections">
                <section class="section">
                    <h2>Executive Summary</h2>
                    <p>This proposal outlines a comprehensive payment processing solution for ${merchantProfile.businessName}, 
                    designed to optimize costs and improve operational efficiency. Our recommended ${proposedProcessor.name} 
                    solution offers competitive rates and modern payment acceptance capabilities.</p>
                    
                    <div class="summary-metrics">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: ${this.brandColors.primary};">
                                    $${costs.proposed.totalMonthlyCost.toFixed(2)}
                                </div>
                                <div style="font-size: 12px; color: #6b7280;">Monthly Cost</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: ${this.brandColors.primary};">
                                    ${(costs.proposed.effectiveRate * 100).toFixed(2)}%
                                </div>
                                <div style="font-size: 12px; color: #6b7280;">Effective Rate</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <h2>Pricing Breakdown</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Component</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Cost</th>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Processing Costs</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                                $${costs.proposed.monthlyProcessingCosts.toFixed(2)}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Monthly Fees</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                                $${costs.proposed.monthlyFees.toFixed(2)}
                            </td>
                        </tr>
                        ${costs.proposed.monthlyEquipment > 0 ? `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Equipment Lease</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                                $${costs.proposed.monthlyEquipment.toFixed(2)}
                            </td>
                        </tr>
                        ` : ''}
                        <tr style="background: #f3f4f6; font-weight: bold;">
                            <td style="padding: 12px; border-top: 2px solid #e5e7eb;">Total Monthly Cost</td>
                            <td style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb;">
                                $${costs.proposed.totalMonthlyCost.toFixed(2)}
                            </td>
                        </tr>
                    </table>
                </section>

                ${hardware && hardware.length > 0 ? `
                <section class="section">
                    <h2>Equipment Recommendations</h2>
                    <div style="display: grid; gap: 20px;">
                        ${hardware.map(item => `
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: white;">
                            <h4 style="margin: 0 0 10px 0; color: ${this.brandColors.primary};">${item.name}</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 14px;">
                                <div><strong>Manufacturer:</strong> ${item.manufacturer}</div>
                                <div><strong>Model:</strong> ${item.model}</div>
                                <div><strong>Monthly Lease:</strong> $${(item.monthlyLease || 0).toFixed(2)}</div>
                                <div><strong>Purchase Price:</strong> $${item.price.toFixed(2)}</div>
                            </div>
                            ${item.features && item.features.length > 0 ? `
                            <div style="margin-top: 15px;">
                                <strong>Features:</strong> ${item.features.join(', ')}
                            </div>
                            ` : ''}
                        </div>
                        `).join('')}
                    </div>
                </section>
                ` : ''}

                <section class="section">
                    <h2>Implementation Timeline</h2>
                    <div style="display: grid; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
                            <div>
                                <strong>Application Submission</strong><br>
                                <span style="color: #6b7280;">Complete merchant application and documentation review (1-2 business days)</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
                            <div>
                                <strong>Underwriting & Approval</strong><br>
                                <span style="color: #6b7280;">Risk assessment and account approval process (2-5 business days)</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
                            <div>
                                <strong>Equipment Setup</strong><br>
                                <span style="color: #6b7280;">Hardware delivery, installation, and testing (1-3 business days)</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.accent}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</div>
                            <div>
                                <strong>Go Live</strong><br>
                                <span style="color: #6b7280;">Begin processing transactions with new system</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <h2>Next Steps</h2>
                    <ol style="line-height: 1.8;">
                        <li>Review and approve this proposal</li>
                        <li>Complete merchant application with required documentation</li>
                        <li>Schedule equipment installation appointment</li>
                        <li>Coordinate with current processor for transition timeline</li>
                        <li>Begin processing with optimized payment solution</li>
                    </ol>
                </section>
            </div>
        </div>

        ${this.getFooterHTML()}
    </body>
    </html>
    `;
  }

  private getBaseCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${this.brandColors.text};
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, ${this.brandColors.primary}, ${this.brandColors.secondary});
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .header-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .content {
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h2 {
            color: ${this.brandColors.primary};
            margin: 30px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid ${this.brandColors.lightGray};
        }
        
        h3, h4 {
            color: ${this.brandColors.primary};
            margin: 20px 0 10px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .info-item {
            background: ${this.brandColors.lightGray};
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${this.brandColors.primary};
        }
        
        .hardware-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .hardware-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }
        
        .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .breakdown-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .breakdown-value {
            font-size: 24px;
            font-weight: bold;
            color: ${this.brandColors.accent};
            margin-top: 10px;
        }
        
        .recommendations ul {
            list-style-type: none;
            padding: 0;
        }
        
        .recommendations li {
            background: ${this.brandColors.lightGray};
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid ${this.brandColors.accent};
        }
        
        .footer {
            background: ${this.brandColors.text};
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        @media print {
            .header, .footer {
                background: ${this.brandColors.primary} !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    `;
  }

  private getHeaderHTML(businessName: string, reportType: string, date: string, agentName: string): string {
    return `
        <div class="header">
            <h1>${reportType}</h1>
            <div class="header-info">
                <div>
                    <strong>Business:</strong> ${businessName}
                </div>
                <div>
                    <strong>Date:</strong> ${date}
                </div>
                <div>
                    <strong>Prepared by:</strong> ${agentName}
                </div>
            </div>
        </div>
    `;
  }

  private getFooterHTML(): string {
    return `
        <div class="footer">
            <div class="footer-content">
                <p><strong>JACC - Merchant Services Intelligence Platform</strong></p>
                <p>Professional payment processing analysis and optimization</p>
                <p style="margin-top: 15px; opacity: 0.8;">
                    This report contains confidential and proprietary information. 
                    Distribution is restricted to authorized personnel only.
                </p>
            </div>
        </div>
    `;
  }

  private async generatePDF(html: string, reportType: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  async saveAndEmailReport(
    reportData: ReportData, 
    reportType: 'comparison' | 'savings' | 'proposal',
    recipientEmail: string,
    generatedBy: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      // Generate PDF
      let pdfBuffer: Buffer;
      let subject: string;
      
      switch (reportType) {
        case 'comparison':
          pdfBuffer = await this.generateComparisonReport(reportData);
          subject = `Processor Comparison Report - ${reportData.merchantProfile.businessName}`;
          break;
        case 'savings':
          pdfBuffer = await this.generateSavingsReport(reportData);
          subject = `Savings Analysis Report - ${reportData.merchantProfile.businessName}`;
          break;
        case 'proposal':
          pdfBuffer = await this.generateProposalReport(reportData);
          subject = `Merchant Services Proposal - ${reportData.merchantProfile.businessName}`;
          break;
      }

      // Save report record to database
      const [reportRecord] = await db.insert(pdfReports).values({
        reportType,
        merchantName: reportData.merchantProfile.businessName,
        processorName: reportData.proposedProcessor.name,
        generatedBy,
        emailRecipient: recipientEmail,
        reportData: reportData as any
      }).returning();

      // Send email with PDF attachment
      const emailContent = this.generateEmailContent(reportData, reportType);
      
      const emailSent = await sendEmail(process.env.SENDGRID_API_KEY!, {
        to: recipientEmail,
        from: reportData.agentEmail,
        subject,
        html: emailContent,
        attachments: [{
          content: pdfBuffer.toString('base64'),
          filename: `${reportType}-report-${reportData.merchantProfile.businessName.replace(/\s+/g, '-')}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      });

      // Update email sent status
      if (emailSent) {
        await db.update(pdfReports)
          .set({ emailSent: true })
          .where(eq(pdfReports.id, reportRecord.id));
      }

      return {
        success: emailSent,
        reportId: reportRecord.id,
        error: emailSent ? undefined : 'Failed to send email'
      };

    } catch (error) {
      console.error('Error saving and emailing report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private generateEmailContent(data: ReportData, reportType: string): string {
    const { merchantProfile, agentName } = data;
    
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">Merchant Services ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <p>Dear Team,</p>
            
            <p>Please find attached the ${reportType} report for <strong>${merchantProfile.businessName}</strong>.</p>
            
            <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">Report Summary</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Business:</strong> ${merchantProfile.businessName}</li>
                    <li><strong>Monthly Volume:</strong> $${merchantProfile.monthlyVolume.toLocaleString()}</li>
                    <li><strong>Industry:</strong> ${merchantProfile.industry}</li>
                    <li><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analysis</li>
                </ul>
            </div>
            
            <p>This comprehensive analysis provides detailed insights into payment processing options and potential cost savings opportunities.</p>
            
            <p>If you have any questions about this report, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>
            <strong>${agentName}</strong><br>
            JACC Merchant Services</p>
        </div>
        
        <div style="background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;"><strong>JACC - Merchant Services Intelligence Platform</strong></p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">Professional payment processing analysis and optimization</p>
        </div>
    </div>
    `;
  }
}

export const pdfReportGenerator = new PDFReportGenerator();