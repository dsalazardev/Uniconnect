// Program types

export interface Program {
  id_program: number;
  name: string;
}

export interface CreateProgramDto {
  name: string;
}

export interface UpdateProgramDto {
  name: string;
}
