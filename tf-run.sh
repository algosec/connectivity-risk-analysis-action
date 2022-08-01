          
          
          
          workDir=$1
          githubWorkspace=$2
          tfDir=$3
          
          cd $githubWorkspace/$tfDir
          
          tmp_stdout=stdout.txt
          tmp_stderr=stderr.txt
          # Run command and control its stdout & stderr
          run_command(){
              #echo  ">>>>" Run "$@"
              eval "$@" >$tmp_stdout 2>$tmp_stderr
              return $?
          }
          # Run command and check its execution state
          # If command's exit code not 0 - terminate processing and print err and out to the relevant standard stream
          run_and_check(){
              if ! run_command  $@; then
                #echo ">>>>" Command [$*] failed
                >&2 cat $tmp_stderr
                cat $tmp_stdout
                exit 1
              #else
                #cat $tmp_stdout
                #echo ">>>>" Command [$*] completed
              fi
          }
          run_and_check terraform init
          run_command terraform fmt -diff
          run_and_check terraform validate -no-color
          run_and_check terraform plan -input=false -no-color -out=/tmp/tf.out
          cat $tmp_stdout

          cd $workDir
          exit 0