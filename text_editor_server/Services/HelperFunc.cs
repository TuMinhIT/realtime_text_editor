using Syncfusion.EJ2.DocumentEditor;
using Newtonsoft.Json;

namespace text_editor_server.Services
{
    public static class HelperFunc
    {
        /// <summary>
        /// Chuyển đổi từ tệp IFormFile (DOCX) sang SFDT (JSON string)
        /// </summary>
        public static async Task<string> ConvertDocxToSfdtAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty or null.");

            await using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            
            return ConvertDocxStreamToSfdt(stream);
        }

        /// <summary>
        /// Chuyển đổi từ luồng (MemoryStream / Stream) DOCX sang SFDT (JSON string)
        /// </summary>
        public static string ConvertDocxStreamToSfdt(Stream stream)
        {
            if (stream == null || stream.Length == 0)
                throw new ArgumentException("Stream is empty or null.");

            stream.Position = 0;

            using var wordDoc = new Syncfusion.DocIO.DLS.WordDocument(
                stream,
                Syncfusion.DocIO.FormatType.Docx);

            // Chuyển đổi từ DocIO thành DocumentEditor
            var editorDoc = WordDocument.Load(wordDoc);

            // Serialize đối tượng sang dạng SFDT JSON
            string sfdtJson = JsonConvert.SerializeObject(editorDoc);

            // Giải phóng bộ nhớ
            editorDoc.Dispose();

            return sfdtJson;
        }



    }
}
