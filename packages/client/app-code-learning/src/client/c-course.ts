/** C curriculum grounding for the language-independent conversational Tutor. */

import type { CourseDefinition } from './course.ts'

/** Introductory C path from program structure through pointers. */
export const cCourse: CourseDefinition = {
  id: 'c-foundations',
  language: 'C',
  codeFence: 'c',
  title: 'course.title',
  description: 'course.description',
  lessons: [
    {
      id: 'hello',
      title: 'lesson.hello.title',
      objective: 'lesson.hello.objective',
      explanation: 'lesson.hello.explanation',
      code: '#include <stdio.h>\n\nint main(void) {\n  printf("Hello, C!\\n");\n  return 0;\n}',
    },
    {
      id: 'values',
      title: 'lesson.values.title',
      objective: 'lesson.values.objective',
      explanation: 'lesson.values.explanation',
      code: 'int age = 18;\ndouble score = 92.5;\nchar grade = \'A\';\n\nprintf("%d %.1f %c\\n", age, score, grade);',
    },
    {
      id: 'control',
      title: 'lesson.control.title',
      objective: 'lesson.control.objective',
      explanation: 'lesson.control.explanation',
      code: 'for (int i = 1; i <= 3; i++) {\n  if (i % 2 == 0) {\n    printf("even\\n");\n  } else {\n    printf("odd\\n");\n  }\n}',
    },
    {
      id: 'functions',
      title: 'lesson.functions.title',
      objective: 'lesson.functions.objective',
      explanation: 'lesson.functions.explanation',
      code: 'int square(int value) {\n  return value * value;\n}\n\nint main(void) {\n  printf("%d\\n", square(6));\n  return 0;\n}',
    },
    {
      id: 'arrays',
      title: 'lesson.arrays.title',
      objective: 'lesson.arrays.objective',
      explanation: 'lesson.arrays.explanation',
      code: 'int scores[] = {88, 91, 95};\nint total = 0;\n\nfor (int i = 0; i < 3; i++) {\n  total += scores[i];\n}\n\nprintf("%d\\n", total);',
    },
    {
      id: 'pointers',
      title: 'lesson.pointers.title',
      objective: 'lesson.pointers.objective',
      explanation: 'lesson.pointers.explanation',
      code: 'int value = 42;\nint *pointer = &value;\n\nprintf("%d\\n", *pointer);\n*pointer = 7;\nprintf("%d\\n", value);',
    },
  ],
}
