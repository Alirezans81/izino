type BookingSmsParams = {
  phone: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
};

export async function sendBookingSms({
  phone,
  customerName,
  serviceName,
  date,
  time,
}: BookingSmsParams) {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateId = Number(process.env.SMS_IR_TEMPLATE_ID);

  if (!apiKey || !templateId || !phone) {
    throw new Error("SMS configuration is missing");
  }

  const response = await fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      mobile: phone,
      templateId,
      parameters: [
        { name: "CUSTOMERNAME", value: customerName },
        { name: "SERVICENAME", value: serviceName },
        { name: "DATE", value: date },
        { name: "TIME", value: time },
      ],
    }),
  });

  const result = await response.json();

  if (!response.ok || result.status !== 1) {
    throw new Error(`SMS failed: ${JSON.stringify(result)}`);
  }

  console.log(result);
  return result;
}
