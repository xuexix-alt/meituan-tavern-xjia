export interface CharacterData {
  年龄?: string | number;
  身份?: string;
  与user关系?: string;
  所处位置?: string;
  当前想法?: string;
  姿势?: string;
  衣着?: string;
  胸乳?: string;
  内衣?: string;
  私处?: string;
  鞋袜?: string;
  舌唇?: string;
  照片?: string;
  // 允许任意键值，防止 TypeScript 报错
  [key: string]: any;
}

export interface StatData {
  章节?: string;
  时间?: string;
  当前地点?: string;
  角色?: Record<string, CharacterData>;
  // 允许扩展
  [key: string]: any;
}
