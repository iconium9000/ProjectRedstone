// clang++ -std=c++11 -stdlib=libc++ -Weverything fun_testing.cpp
// ./a.out


#include <iostream>
#include <fstream>
#include <string>
using namespace std;


#define loop(N,I,F) for (int I = 0; I < N; ++I) F;

struct Dic {
  Dic* dic_array[26] = {};
  bool is_word;

  ~Dic() {
    loop(26, dic_array_index, {
      if (this->dic_array[dic_array_index]) {
        delete this->dic_array[dic_array_index];
      }
    })
  }
};

void print_dic(Dic* dic, char* char_array, int depth_index = 0, string tab = "");

int main(int num_arguments, char ** argument_array) {

  Dic dic;
  int max_word_length = 0;

  {
    ifstream fin;
    fin.open(argument_array[1]);
    string temp;
    while (fin) {
      fin >> temp;
      const char* char_array = temp.c_str();

      Dic* temp_dic = &dic;

      int char_array_index = 0;
      while (char_array[char_array_index]) {
        int char_index = (char_array[char_array_index] & 0x1F) - 1;

        if (!temp_dic->dic_array[char_index]) {
          temp_dic->dic_array[char_index] = new Dic;
        }

        temp_dic = temp_dic->dic_array[char_index];
        ++char_array_index;
      }
      temp_dic->is_word = true;

      if (max_word_length < char_array_index) {
        max_word_length = char_array_index;
      }
    }
    fin.close();
  }

  {
    char* char_array = new char[max_word_length];
    print_dic(&dic, char_array);
    delete [] char_array;
  }
}

void print_dic(Dic* dic, char* char_array, int depth_index, string tab) {
  if (dic) {
    if (dic->is_word) {
      char_array[depth_index] = '\0';
      cout << char_array << endl;
    }
    loop(26, char_array_index, {
      char_array[depth_index] = 'a' + char_array_index;
      print_dic(dic->dic_array[char_array_index], char_array,
        depth_index + 1, tab + ' ');
    })
  }
}
