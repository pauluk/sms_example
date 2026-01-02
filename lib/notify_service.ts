import { NotifyClient } from 'notifications-node-client';

export class NotifyService {
  private client: any; // NotifyClient type is not exported or types are missing sometimes, using any for safety

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Notify API Key is required');
    }
    this.client = new NotifyClient(apiKey);
  }

  /**
   * Sends an SMS to the specified phone number.
   * @param phone The phone number to send the SMS to.
   * @param templateId The ID of the template to use.
   * @param personalization An object containing the personalization variables.
   * @returns The response from the Notify API.
   */
  async sendSms(phone: string, templateId: string, personalization: Record<string, any> = {}): Promise<any> {
    try {
      const response = await this.client.sendSms(templateId, phone, {
        personalisation: personalization,
        reference: null,
      });
      console.log(`SMS sent successfully to ${phone}. ID: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to send SMS to ${phone}: ${error.message}`);
      // Log full error details if available
      if (error.response) {
        console.error('Notify API Error Response:', error.response.data);
      }
      throw error;
    }
  }
}
