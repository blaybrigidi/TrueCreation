import CryptoJS from 'crypto-js';

const key = CryptoJS.enc.Hex.parse('049c7e635ebc61027458aff460a5f86aae6efbef0ef530d8c1124840baad282d');

export const decryptData = (encryptedData: {
  iv: string;
  encryptedData: string;
}) => {
  try {
    console.log('Starting decryption with data:', encryptedData);
    
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
    console.log('Parsed IV:', iv.toString());
    
    const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.encryptedData);
    console.log('Parsed ciphertext:', ciphertext.toString());
    
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext
    });
    console.log('Created cipher params');

    const decrypted = CryptoJS.AES.decrypt(
      cipherParams,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    console.log('Raw decrypted data:', decrypted.toString());

    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    console.log('Decrypted string:', decryptedStr);
    
    try {
      const parsed = JSON.parse(decryptedStr);
      console.log('Parsed JSON:', parsed);
      return parsed;
    } catch (parseError) {
      console.log('Failed to parse as JSON, returning as string:', parseError);
      return decryptedStr;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}; 