using text_editor_server.Entities;

namespace text_editor_server.Services
{
    /// <summary>
    /// Operational Transformation service for handling concurrent edits
    /// Implements basic OT algorithm for conflict resolution
    /// </summary>
    public interface IOperationalTransformService
    {
        /// <summary>
        /// Transform a remote operation against local operations
        /// </summary>
        OperationalChange TransformOperation(
            OperationalChange remoteOp,
            List<OperationalChange> localOps
        );

        /// <summary>
        /// Apply operation to content
        /// </summary>
        string ApplyOperation(string content, OperationalChange operation);

        /// <summary>
        /// Check if operation is valid for current content
        /// </summary>
        bool IsOperationValid(string content, OperationalChange operation);
    }

    public class OperationalTransformService : IOperationalTransformService
    {
        /// <summary>
        /// Transform remote operation against local operations using OT algorithm
        /// </summary>
        public OperationalChange TransformOperation(
            OperationalChange remoteOp,
            List<OperationalChange> localOps)
        {
            var transformedOp = remoteOp;

            foreach (var localOp in localOps)
            {
                transformedOp = Transform(transformedOp, localOp);
            }

            return transformedOp;
        }

        /// <summary>
        /// Apply a single operation to content
        /// </summary>
        public string ApplyOperation(string content, OperationalChange operation)
        {
            if (!IsOperationValid(content, operation))
            {
                throw new InvalidOperationException(
                    $"Operation is invalid. Content length: {content.Length}, " +
                    $"Operation position: {operation.Position}, length: {operation.Length}"
                );
            }

            return operation.OperationType switch
            {
                "insert" => content.Insert(operation.Position, operation.Text),
                "delete" => content.Remove(operation.Position, operation.Length),
                "replace" => content.Remove(operation.Position, operation.Length)
                    .Insert(operation.Position, operation.Text),
                _ => throw new ArgumentException($"Unknown operation type: {operation.OperationType}")
            };
        }

        /// <summary>
        /// Check if operation is valid for the given content
        /// </summary>
        public bool IsOperationValid(string content, OperationalChange operation)
        {
            if (string.IsNullOrEmpty(operation.OperationType))
                return false;

            switch (operation.OperationType)
            {
                case "insert":
                    return operation.Position >= 0 && operation.Position <= content.Length;

                case "delete":
                    return operation.Position >= 0 &&
                           operation.Position + operation.Length <= content.Length;

                case "replace":
                    return operation.Position >= 0 &&
                           operation.Position + operation.Length <= content.Length;

                default:
                    return false;
            }
        }

        /// <summary>
        /// Transform operation A against operation B
        /// This is the core OT algorithm
        /// </summary>
        private OperationalChange Transform(OperationalChange opA, OperationalChange opB)
        {
            var result = new OperationalChange
            {
                Id = opA.Id,
                SectionId = opA.SectionId,
                UserId = opA.UserId,
                OperationType = opA.OperationType,
                Text = opA.Text,
                Position = opA.Position,
                Length = opA.Length,
                VersionBefore = opA.VersionBefore,
                VersionAfter = opA.VersionAfter
            };

            // Adjust position based on opB
            int adjustedPosition = opA.Position;

            if (opB.OperationType == "insert")
            {
                if (opB.Position < opA.Position)
                {
                    adjustedPosition += opB.Text.Length;
                }
                else if (opB.Position == opA.Position && opB.UserId.CompareTo(opA.UserId) < 0)
                {
                    // Tie-breaking: if same position, lower user ID goes first
                    adjustedPosition += opB.Text.Length;
                }
            }
            else if (opB.OperationType == "delete")
            {
                int deleteEnd = opB.Position + opB.Length;
                int opAEnd = opA.Position + opA.Length;

                if (deleteEnd <= opA.Position)
                {
                    // Deletion is before this operation
                    adjustedPosition -= opB.Length;
                }
                else if (opB.Position < opA.Position && deleteEnd > opA.Position)
                {
                    // Deletion overlaps with start of this operation
                    int overlap = deleteEnd - opA.Position;
                    adjustedPosition = opB.Position;
                    if (opA.OperationType == "delete")
                    {
                        result.Length = Math.Max(0, result.Length - overlap);
                    }
                }
            }

            result.Position = adjustedPosition;
            return result;
        }
    }
}
