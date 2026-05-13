//using text_editor_server.Enums;

//namespace text_editor_server.Entities
//{
//    public class SectionOperation
//    {
//        public Guid Id { get; set; }

//        public Guid SectionId { get; set; }
        
//        public OperationType Type { get; set; }

//        public string Payload { get; set; }

//        //Version client edit:
//        public long BaseVersion { get; set; } = 0;

//        //version sau khi apply operation này:
//        public long ResultVersion { get; set; } = 0;

//        //timestamp khi operation được tạo ra, dùng để sắp xếp thứ tự các operation

//        public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

//        public Section Section { get; set; }
//    }
//}
