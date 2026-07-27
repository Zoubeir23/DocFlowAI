/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WidgetConversation {
  id: string;
  messages: unknown[];
}

export async function resolveOrCreateConversation(
  db: any,
  clinicId: string,
  conversationId: string | undefined,
  patientTempId: string
): Promise<WidgetConversation | null> {
  if (conversationId) {
    const { data } = await db
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("clinic_id", clinicId)
      // Empêche un visiteur qui devinerait/récupérerait un conversationId de
      // reprendre la conversation d'un autre patient de la même clinique.
      .eq("patient_temp_id", patientTempId)
      .maybeSingle();
    if (data) {
      return { id: data.id, messages: data.messages as unknown[] };
    }
  }

  const { data } = await db
    .from("ai_conversations")
    .insert({
      clinic_id: clinicId,
      patient_temp_id: patientTempId,
      messages: [],
    })
    .select()
    .maybeSingle();

  if (data) {
    return { id: data.id, messages: [] };
  }

  return null;
}
