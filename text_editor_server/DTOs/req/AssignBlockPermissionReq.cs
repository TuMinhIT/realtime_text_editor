using text_editor_server.Entities;

namespace text_editor_server.DTOs.req
{
    public class AssignBlockPermissionReq
    {
        public Guid SectionId { get; set; }
        public Guid UserId { get; set; }
        public PermissionLevel Permission { get; set; }      
    }
}
